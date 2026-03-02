const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data export from SQLite...');
  
  try {
    const data = {
      users: await prisma.user.findMany(),
      components: await prisma.component.findMany(),
      relationships: await prisma.relationship.findMany(),
      projects: await prisma.project.findMany(),
      projectSnapshots: await prisma.projectSnapshot.findMany(),
      projectChanges: await prisma.projectChange.findMany(),
      gaps: await prisma.gap.findMany(),
      gapPhases: await prisma.gapPhase.findMany(),
      projectComponents: await prisma.projectComponent.findMany(),
      projectVersions: await prisma.projectVersion.findMany(),
      activityLogs: await prisma.activityLog.findMany(),
      componentHistories: await prisma.componentHistory.findMany(),
    };

    const filePath = './data-export.json';
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    console.log(`✅ Data successfully exported to ${filePath}`);
    console.log(`Exported records counts:`);
    Object.keys(data).forEach(key => {
        console.log(`- ${key}: ${data[key].length}`);
    });

  } catch (error) {
    console.error('Error during data export:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
