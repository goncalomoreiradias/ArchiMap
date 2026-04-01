import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = session.user as any;
        const userRole = user.role || 'Viewer';

        // Only Admin and Chief Architect can view the pending queue
        if (userRole !== 'Admin' && userRole !== 'Chief Architect') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Build org filter — super admin sees all, everyone else scoped to their org
        let orgFilter: any = {};
        if (user.id !== 'admin-id') {
            if (user.organizationId) {
                // Match gaps that belong to this org, OR gaps whose project belongs to this org
                orgFilter = {
                    OR: [
                        { organizationId: user.organizationId },
                        { project: { organizationId: user.organizationId } }
                    ]
                };
            } else {
                return NextResponse.json([]); // No org = no results
            }
        }

        const pendingGaps = await db.gap.findMany({
            where: {
                ...orgFilter,
                approvalStatus: 'PENDING_REVIEW'
            },
            include: {
                project: {
                    select: { id: true, name: true }
                },
                changes: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        return NextResponse.json(pendingGaps);
    } catch (error: any) {
        console.error('Failed to fetch pending approvals:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
