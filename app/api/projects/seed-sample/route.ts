import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
    try {
        // Clear existing projects
        await db.projectChange.deleteMany();
        await db.projectSnapshot.deleteMany();
        await db.project.deleteMany();

        // Create sample AI Banking Transformation project
        const project = await db.project.create({
            data: {
                name: 'AI-Powered Banking Transformation',
                description: 'Modernization initiative to implement AI capabilities across AML, Credit, and Customer Service domains using GCP-first architecture.',
                status: 'In Progress',
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-12-31'),
                currentState: 'AS-IS',
            }
        });

        // Define AS-IS Business Capabilities
        const asIsComponents = [
            { id: 'BC-FC-001', type: 'bc', name: 'AML alert triage & investigation assist' },
            { id: 'BC-CR-001', type: 'bc', name: 'Credit scoring & affordability (ML)' },
            { id: 'BC-CUST-001', type: 'bc', name: 'KYC automation (doc+data verification)' },
        ];

        // Create AS-IS snapshots
        for (const component of asIsComponents) {
            await db.projectSnapshot.create({
                data: {
                    projectId: project.id,
                    snapshotType: 'AS-IS',
                    catalogComponentId: component.id,
                    catalogComponentType: component.type,
                    notes: `Initial ${component.name} capability`
                }
            });
        }

        return NextResponse.json({
            success: true,
            project,
            message: 'Sample project created successfully'
        });
    } catch (error) {
        console.error('Error seeding project:', error);
        return NextResponse.json(
            { error: 'Failed to seed project' },
            { status: 500 }
        );
    }
}
