const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function checkRelations() {
    try {
        const floatingNode = await prisma.component.findFirst({
            where: { name: { contains: 'Run Banking Operations' } }
        });

        const selectedNode = await prisma.component.findFirst({
            where: { name: { contains: 'Branch Location Operations' } }
        });

        const output = { floatingNode, selectedNode, floatingRelations: [] };

        const relations = await prisma.relationship.findMany({
            where: {
                OR: [
                    { sourceComponentId: floatingNode.id },
                    { targetComponentId: floatingNode.id }
                ]
            }
        });

        for (const rel of relations) {
            const otherId = rel.sourceComponentId === floatingNode.id ? rel.targetComponentId : rel.sourceComponentId;
            const otherNode = await prisma.component.findUnique({ where: { id: otherId } });

            output.floatingRelations.push({
                relId: rel.id,
                relType: rel.type,
                otherId: otherId,
                otherName: otherNode ? otherNode.name : 'UNKNOWN'
            });
        }

        fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRelations();
