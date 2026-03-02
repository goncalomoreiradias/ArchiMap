import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
    const gaps = await db.gap.findMany({
        include: { changes: true }
    });

    let totalUpdated = 0;

    for (const gap of gaps) {
        if (!gap.changes || gap.changes.length === 0) continue;

        const componentIds = gap.changes.map(c => c.componentId);

        // Find orphan relationships in the same project
        const relations = await db.projectChange.findMany({
            where: {
                projectId: gap.projectId,
                operation: 'ADD_RELATION',
                gapId: null
            }
        });

        const relationsToAssign: string[] = [];

        relations.forEach(rel => {
            if (rel.componentData) {
                try {
                    const data = JSON.parse(rel.componentData);
                    if (componentIds.includes(data.sourceId) || componentIds.includes(data.targetId)) {
                        relationsToAssign.push(rel.id);
                    }
                } catch (e) { }
            }
        });

        if (relationsToAssign.length > 0) {
            console.log(`Gap ${gap.title}: Assigning ${relationsToAssign.length} missing relationships.`);
            await db.projectChange.updateMany({
                where: { id: { in: relationsToAssign } },
                data: { gapId: gap.id }
            });
            totalUpdated += relationsToAssign.length;
        }
    }

    console.log(`\nDone! Retroactively fixed ${totalUpdated} relationships across all gaps.`);
}

main().catch(console.error).finally(() => db.$disconnect());
