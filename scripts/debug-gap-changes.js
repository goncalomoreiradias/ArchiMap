const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
    const projects = await db.project.findMany({
        include: {
            changes: true,
            asIsSnapshots: true,
            targetSnapshots: true
        }
    });

    for (const project of projects) {
        console.log(`\n=== PROJECT: ${project.name} ===`);
        for (const change of project.changes) {
            console.log(`[Gap Change] OP: ${change.operation}, Component: ${change.componentName} (${change.componentType}) - ID: ${change.componentId}`);
            if (change.componentData) {
                console.log(`    Data:`, JSON.parse(change.componentData));
            }
        }

        console.log("\n  -- As-Is Snapshots --");
        for (const snap of project.asIsSnapshots) {
            console.log(`  [As-Is] ${snap.catalogComponentId} (${snap.catalogComponentType})`);
        }

        console.log("\n  -- Target Snapshots --");
        for (const snap of project.targetSnapshots) {
            console.log(`  [Target] ${snap.catalogComponentId} (${snap.catalogComponentType})`);
        }
    }
}
main().catch(console.error).finally(() => db.$disconnect());
