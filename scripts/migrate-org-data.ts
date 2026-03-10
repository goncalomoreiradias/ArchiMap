import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
    // 1. Find all organizations
    const orgs = await db.organization.findMany({
        include: { _count: { select: { members: true, components: true } } }
    });

    console.log('\n=== Organizations ===');
    orgs.forEach(org => {
        console.log(`  [${org.id}] ${org.name} (${org._count.members} members, ${org._count.components} components)`);
    });

    // 2. Count unscoped data
    const nullOrgComponents = await db.component.count({ where: { organizationId: null } });
    const nullOrgRelationships = await db.relationship.count({ where: { organizationId: null } });
    const nullOrgProjects = await db.project.count({ where: { organizationId: null } });

    console.log('\n=== Unscoped Records (organizationId = null) ===');
    console.log(`  Components: ${nullOrgComponents}`);
    console.log(`  Relationships: ${nullOrgRelationships}`);
    console.log(`  Projects: ${nullOrgProjects}`);

    if (orgs.length === 0) {
        console.log('\nNo organizations found. Create an organization first.');
        return;
    }

    // 3. Ask which org to assign data to (use first org if only one)
    const targetOrg = orgs[0];
    console.log(`\nWill assign all null-org data to: [${targetOrg.id}] ${targetOrg.name}`);

    // 4. Perform migration
    const [compResult, relResult, projResult] = await Promise.all([
        db.component.updateMany({
            where: { organizationId: null },
            data: { organizationId: targetOrg.id }
        }),
        db.relationship.updateMany({
            where: { organizationId: null },
            data: { organizationId: targetOrg.id }
        }),
        db.project.updateMany({
            where: { organizationId: null },
            data: { organizationId: targetOrg.id }
        })
    ]);

    console.log('\n=== Migration Complete ===');
    console.log(`  Components updated: ${compResult.count}`);
    console.log(`  Relationships updated: ${relResult.count}`);
    console.log(`  Projects updated: ${projResult.count}`);
    console.log('\nDone! All data now belongs to:', targetOrg.name);
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
