const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanCatalog() {
    console.log('Starting cleanup process...');

    try {
        // Find all components referenced in ProjectComponent
        const projectComponents = await prisma.projectComponent.findMany({ select: { componentId: true } });
        const referencedComponentIds = new Set(projectComponents.map(pc => pc.componentId));

        // Find all components referenced in ProjectChange
        const projectChanges = await prisma.projectChange.findMany({ select: { componentId: true } });
        projectChanges.forEach(pc => referencedComponentIds.add(pc.componentId));

        // Find all components referenced in ProjectSnapshot
        const projectSnapshots = await prisma.projectSnapshot.findMany({ select: { catalogComponentId: true } });
        projectSnapshots.forEach(ps => referencedComponentIds.add(ps.catalogComponentId));

        const keepIds = Array.from(referencedComponentIds);
        console.log(`Found ${keepIds.length} components referenced by projects.`);

        // Delete relationships not linked to kept components
        const deletedRelationships = await prisma.relationship.deleteMany({
            where: {
                OR: [
                    { sourceComponentId: { notIn: keepIds } },
                    { targetComponentId: { notIn: keepIds } }
                ]
            }
        });
        console.log(`Deleted ${deletedRelationships.count} orphan relationships.`);

        // Delete unreferenced components
        const deletedComponents = await prisma.component.deleteMany({
            where: {
                id: { notIn: keepIds }
            }
        });
        console.log(`Deleted ${deletedComponents.count} unreferenced components.`);

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanCatalog();
