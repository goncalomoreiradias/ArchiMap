import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;
        const userRole = user.role || 'Viewer';
        const orgId = user.organizationId;

        const body = await request.json();
        const { _fromApproval, ...data } = body;

        // Architects must submit for approval
        if (userRole === 'Architect' && !_fromApproval) {
            const component = await db.component.findUnique({ where: { id } });
            if (!component) return NextResponse.json({ error: 'Component not found' }, { status: 404 });

            // Gaps require a projectId in the schema. Find a project for this organization.
            let project = await db.project.findFirst({
                where: { organizationId: orgId || null }
            });

            // If no project exists for this org, we may need a 'Global Catalog' system project
            if (!project) {
                project = await db.project.create({
                    data: {
                        name: 'Catalog Maintenance (System)',
                        description: 'System project for global component edits and catalog maintenance.',
                        status: 'Active',
                        organizationId: orgId || null
                    }
                });
            }

            // Create a COMPONENT_EDIT_REQUEST gap
            const editGap = await db.gap.create({
                data: {
                    projectId: project.id,
                    title: `Edit Component: ${component.name}`,
                    description: `An Architect has requested changes to component "${component.name}".`,
                    status: 'In Progress',
                    approvalStatus: 'PENDING_REVIEW',
                    metadata: JSON.stringify({
                        type: 'COMPONENT_EDIT_REQUEST',
                        componentId: id,
                        requestedChanges: data
                    }),
                    organizationId: orgId || component.organizationId || null,
                }
            });

            return NextResponse.json({
                success: true,
                pending: true,
                message: 'Update submitted for approval.',
                gapId: editGap.id
            }, { status: 202 });
        }

        // Admins, Chief Architects, or Approvals can update directly
        const updated = await db.component.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('[Component Update] Error:', error);
        return NextResponse.json({ error: 'Failed to update component' }, { status: 500 });
    }
}
