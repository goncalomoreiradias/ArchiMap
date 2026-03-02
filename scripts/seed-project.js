const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding sample project...');

    try {
        // Clear existing projects to avoid duplicates/conflicts for this demo
        await prisma.projectChange.deleteMany();
        await prisma.projectSnapshot.deleteMany();
        await prisma.project.deleteMany();

        // Create sample AI Banking Transformation project
        const project = await prisma.project.create({
            data: {
                name: 'AI-Powered Banking Transformation',
                description: 'Modernization initiative to implement AI capabilities across AML, Credit, and Customer Service domains using GCP-first architecture.',
                status: 'In Progress',
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-12-31'),
                currentState: 'AS-IS',
            }
        });

        console.log(`Created project: ${project.name} (${project.id})`);

        // Define AS-IS Business Capabilities from the catalog
        // Note: These IDs must exist in your catalog.json, but for the snapshots we just store the ID string.
        // The visualization API uses these IDs to look up details in catalog.json.
        const asIsComponents = [
            { id: 'BC-ID-026', type: 'bc', name: 'AML alert triage & investigation assist' },
            { id: 'BC-ID-024', type: 'bc', name: 'Credit scoring & affordability (ML)' },
            { id: 'BC-ID-005', type: 'bc', name: 'KYC automation (doc+data verification)' },
        ];

        // Create AS-IS snapshots
        for (const component of asIsComponents) {
            await prisma.projectSnapshot.create({
                data: {
                    projectId: project.id,
                    snapshotType: 'AS-IS',
                    catalogComponentId: component.id,
                    catalogComponentType: component.type,
                    notes: `Initial ${component.name} capability`
                }
            });
            console.log(`Added snapshot for ${component.name}`);
        }

        console.log('Seeding completed successfully.');
    } catch (error) {
        console.error('Error seeding project:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
