import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/audit-logger';
import { requireEditor, requireAuth } from '@/lib/auth-utils';

export async function GET() {
    try {
        const authResult = await requireAuth();
        const orgFilter = authResult.organizationId ? { organizationId: authResult.organizationId } : {};

        const projects = await db.project.findMany({
            where: orgFilter
        });
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

        const authResult = await requireEditor();
        if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        const userId = (authResult.session.user as any).id;

        const project = await db.project.create({
            data: {
                name,
                description: description || '',
                status: status || 'Planned',
                startDate: new Date(),
                endDate: null,
                organizationId: authResult.organizationId || null
            }
        });


        // NOTE: Projects start EMPTY. 
        // Users add components explicitly from the catalog via the edit workflow.
        // The old logic that auto-snapshots ALL 'As-Is' components was incorrect -
        // it caused all DB components to appear in new projects.

        await logActivity(userId, "CREATE_PROJECT", project.id, `Created project: ${name}`);

        return NextResponse.json(project);
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}
