import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
    const gaps = await db.gap.findMany({
        include: {
            changes: true,
            phases: { include: { changes: true } }
        }
    });

    for (const gap of gaps) {
        console.log(`\n=== GAP: ${gap.title} (Start: ${gap.startDate}, End: ${gap.endDate}) ===`);
        for (const change of gap.changes) {
            console.log(`[Gap Change] OP: ${change.operation}, Component: ${change.componentName} (${change.componentType}) - ID: ${change.componentId}`);
            if (change.componentData || "{}") {
                console.log(`    Data:`, JSON.parse(change.componentData || "{}"));
            }
        }

        for (const phase of gap.phases) {
            console.log(`  -- PHASE: ${phase.name} (Start: ${phase.startDate}, End: ${phase.endDate}) --`);
            for (const change of phase.changes) {
                console.log(`  [Phase Change] OP: ${change.operation}, Component: ${change.componentName} (${change.componentType}) - ID: ${change.componentId}`);
                if (change.componentData || "{}") {
                    console.log(`      Data:`, JSON.parse(change.componentData || "{}"));
                }
            }
        }
    }
}
main().catch(console.error).finally(() => db.$disconnect());
