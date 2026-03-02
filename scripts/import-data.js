const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting data import to Supabase...');

    try {
        const filePath = './data-export.json';
        if (!fs.existsSync(filePath)) {
            throw new Error('data-export.json not found!');
        }

        const rawData = fs.readFileSync(filePath);
        const data = JSON.parse(rawData);

        // Because of foreign key constraints, we must import in the correct order.
        // 1. Users
        if (data.users && data.users.length > 0) {
            console.log(`Importing ${data.users.length} Users...`);
            await prisma.user.createMany({ data: data.users, skipDuplicates: true });
        }

        // 2. Components
        if (data.components && data.components.length > 0) {
            console.log(`Importing ${data.components.length} Components...`);
            await prisma.component.createMany({ data: data.components, skipDuplicates: true });
        }

        // 3. Relationships
        if (data.relationships && data.relationships.length > 0) {
            console.log(`Importing ${data.relationships.length} Relationships...`);
            await prisma.relationship.createMany({ data: data.relationships, skipDuplicates: true });
        }

        // 4. Projects
        if (data.projects && data.projects.length > 0) {
            console.log(`Importing ${data.projects.length} Projects...`);
            await prisma.project.createMany({ data: data.projects, skipDuplicates: true });
        }

        // 5. Project Dependencies
        if (data.projectSnapshots && data.projectSnapshots.length > 0) {
            console.log(`Importing ${data.projectSnapshots.length} Project Snapshots...`);
            await prisma.projectSnapshot.createMany({ data: data.projectSnapshots, skipDuplicates: true });
        }

        if (data.gaps && data.gaps.length > 0) {
            console.log(`Importing ${data.gaps.length} Gaps...`);
            await prisma.gap.createMany({ data: data.gaps, skipDuplicates: true });
        }

        if (data.gapPhases && data.gapPhases.length > 0) {
            console.log(`Importing ${data.gapPhases.length} Gap Phases...`);
            await prisma.gapPhase.createMany({ data: data.gapPhases, skipDuplicates: true });
        }

        if (data.projectChanges && data.projectChanges.length > 0) {
            console.log(`Importing ${data.projectChanges.length} Project Changes...`);
            await prisma.projectChange.createMany({ data: data.projectChanges, skipDuplicates: true });
        }

        if (data.projectComponents && data.projectComponents.length > 0) {
            console.log(`Importing ${data.projectComponents.length} Project Components...`);
            await prisma.projectComponent.createMany({ data: data.projectComponents, skipDuplicates: true });
        }

        if (data.projectVersions && data.projectVersions.length > 0) {
            console.log(`Importing ${data.projectVersions.length} Project Versions...`);
            await prisma.projectVersion.createMany({ data: data.projectVersions, skipDuplicates: true });
        }

        // 6. Others
        if (data.activityLogs && data.activityLogs.length > 0) {
            console.log(`Importing ${data.activityLogs.length} Activity Logs...`);
            await prisma.activityLog.createMany({ data: data.activityLogs, skipDuplicates: true });
        }

        if (data.componentHistories && data.componentHistories.length > 0) {
            console.log(`Importing ${data.componentHistories.length} Component Histories...`);
            await prisma.componentHistory.createMany({ data: data.componentHistories, skipDuplicates: true });
        }

        console.log('✅ Data successfully imported to Supabase!');
    } catch (error) {
        console.error('Error during data import:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
