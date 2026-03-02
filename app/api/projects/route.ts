import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/logger';
import { verifyToken } from '@/lib/jwt';

export async function GET() {
    try {
        const projects = await db.project.findMany();
        return NextResponse.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name, description, status } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
        }

        const token = request.cookies.get("token")?.value;
        const user = token ? verifyToken(token) as any : null;
        const userId = user?.id || 'anonymous'; // Should ideally require auth

        const project = await db.project.create({
            data: {
                name,
                description: description || '',
                status: status || 'Planned',
                startDate: new Date(),
                endDate: null
            }
        });


        // NOTE: Projects start EMPTY. 
        // Users add components explicitly from the catalog via the edit workflow.
        // The old logic that auto-snapshots ALL 'As-Is' components was incorrect -
        // it caused all DB components to appear in new projects.

        if (userId !== 'anonymous') {
            await logActivity(userId, "CREATE_PROJECT", project.id, `Created project: ${name}`);
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}
