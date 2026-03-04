const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    let out = "";
    const projects = await prisma.project.findMany();
    out += "=== PROJECTS ===\n";
    out += JSON.stringify(projects.map(p => ({ id: p.id, name: p.name, status: p.status, endDate: p.endDate })), null, 2) + "\n";

    const gaps = await prisma.gap.findMany({
        include: {
            changes: true
        }
    });
    out += "=== GAPS ===\n";
    out += JSON.stringify(gaps.map(g => ({
        id: g.id,
        projectId: g.projectId,
        title: g.title,
        status: g.status,
        endDate: g.endDate,
        changesCount: g.changes.length
    })), null, 2) + "\n";

    const changes = await prisma.projectChange.findMany();
    out += "=== CHANGES ===\n";
    out += `Total changes: ${changes.length}\n`;

    fs.writeFileSync('logs.txt', out);
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
