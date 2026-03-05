const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Multi-Tenancy Data Migration...');

    try {
        // 1. Ensure the Default Organization Exists
        let defaultOrg = await prisma.organization.findUnique({
            where: { slug: 'archimap-foundation' }
        });

        if (!defaultOrg) {
            console.log('Creating Default Organization: ArchiMap Foundation');
            defaultOrg = await prisma.organization.create({
                data: {
                    name: 'ArchiMap Foundation',
                    slug: 'archimap-foundation'
                }
            });
        }

        const orgId = defaultOrg.id;
        console.log(`Default Org ID: ${orgId}`);

        // 2. Assign all existing Users to the Organization
        const users = await prisma.user.findMany();
        for (const user of users) {
            const membership = await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId: orgId,
                        userId: user.id
                    }
                }
            });

            if (!membership) {
                await prisma.organizationMember.create({
                    data: {
                        organizationId: orgId,
                        userId: user.id,
                        role: user.role === 'Admin' ? 'OWNER' : 'MEMBER'
                    }
                });
                console.log(`Added user ${user.username || user.email} to org ${defaultOrg.name}`);
            }
        }

        // 3. Migrate Core Data: Components
        const updatedComponents = await prisma.component.updateMany({
            where: { organizationId: null },
            data: { organizationId: orgId }
        });
        console.log(`Migrated ${updatedComponents.count} Components to Org`);

        // 4. Migrate Core Data: Relationships
        const updatedRelations = await prisma.relationship.updateMany({
            where: { organizationId: null },
            data: { organizationId: orgId }
        });
        console.log(`Migrated ${updatedRelations.count} Relationships to Org`);

        // 5. Migrate Core Data: Projects
        const updatedProjects = await prisma.project.updateMany({
            where: { organizationId: null },
            data: { organizationId: orgId }
        });
        console.log(`Migrated ${updatedProjects.count} Projects to Org`);

        // 6. Migrate Core Data: Gaps
        const updatedGaps = await prisma.gap.updateMany({
            where: { organizationId: null },
            data: { organizationId: orgId }
        });
        console.log(`Migrated ${updatedGaps.count} Gaps to Org`);

        // 7. Migrate Core Data: ActivityLogs
        const updatedLogs = await prisma.activityLog.updateMany({
            where: { organizationId: null },
            data: { organizationId: orgId }
        });
        console.log(`Migrated ${updatedLogs.count} Activity Logs to Org`);

        console.log('✅ Multi-Tenancy Migration Completed Successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
