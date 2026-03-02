const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    let output = "";

    // 1. Find the ID of 'Dados das empresas'
    const component = await prisma.component.findFirst({
        where: { name: 'Dados das empresas' }
    });
    output += `Existing 'Dados das empresas' ID: ${component ? component.id : 'NOT FOUND'}\n`;

    // 2. Check changes for that CUSTOM ID seen in debug output
    const customId = "CUSTOM-DC-1770829841998";
    const changes = await prisma.projectChange.findMany({
        where: {
            componentId: customId
        }
    });

    output += `Changes for ${customId}: ${changes.length}\n`;
    changes.forEach(c => {
        output += ` - Op: ${c.operation}, Type: ${c.componentType}\n`;
    });

    // 3. Check for the relationship again to be sure
    const relChanges = await prisma.projectChange.findMany({
        where: {
            componentType: { in: ['relation', 'relationship'] }
        }
    });

    output += "Checking Relationships sources/targets:\n";
    relChanges.forEach(rc => {
        try {
            const data = JSON.parse(rc.componentData);
            if (data.sourceId === customId || data.targetId === customId) {
                output += ` - Relationship ${rc.id} connects to ${customId} via ${data.sourceId === customId ? 'Source' : 'Target'}\n`;
                output += `   Full Data: ${rc.componentData}\n`;
            }
        } catch (e) { }
    });

    fs.writeFileSync('debug_ids_output.txt', output);
    console.log("Written to debug_ids_output.txt");
}

main()
    .catch(e => {
        throw e
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
