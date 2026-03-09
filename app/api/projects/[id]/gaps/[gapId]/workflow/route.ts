import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Valid transitions: DRAFT -> PENDING_REVIEW -> APPROVED | REJECTED -> DRAFT (revert)
const VALID_TRANSITIONS: Record<string, string[]> = {
    'DRAFT': ['PENDING_REVIEW'],
    'PENDING_REVIEW': ['APPROVED', 'REJECTED', 'DRAFT'],
    'REJECTED': ['DRAFT'],
    'APPROVED': [], // Terminal state (immutable)
};

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; gapId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: projectId, gapId } = params;
        const body = await request.json();
        const { action, rejectionReason } = body;

        if (!action) {
            return NextResponse.json({ error: 'Action is required (submit, approve, reject, revert)' }, { status: 400 });
        }

        // Fetch current Gap
        const gap = await db.gap.findUnique({ where: { id: gapId } });
        if (!gap || gap.projectId !== projectId) {
            return NextResponse.json({ error: 'Gap not found' }, { status: 404 });
        }

        const currentStatus = gap.approvalStatus || 'DRAFT';
        const userRole = (session.user as any).role || 'Viewer';
        const userId = (session.user as any).id || 'system';

        let newStatus: string;
        let updateData: any = {};

        switch (action) {
            case 'submit':
                // Architects and Admins can submit for review
                if (!['Architect', 'Admin'].includes(userRole)) {
                    return NextResponse.json({ error: 'Only Architects or Admins can submit for review' }, { status: 403 });
                }
                newStatus = 'PENDING_REVIEW';
                break;

            case 'approve':
                // Only Admins can approve
                if (userRole !== 'Admin') {
                    return NextResponse.json({ error: 'Only Admins can approve gaps' }, { status: 403 });
                }
                if (currentStatus !== 'PENDING_REVIEW') {
                    return NextResponse.json({ error: 'Gap must be in PENDING_REVIEW to approve' }, { status: 400 });
                }
                newStatus = 'APPROVED';
                updateData.approvedById = userId;
                updateData.approvedAt = new Date();
                updateData.rejectionReason = null;
                break;

            case 'reject':
                // Only Admins can reject
                if (userRole !== 'Admin') {
                    return NextResponse.json({ error: 'Only Admins can reject gaps' }, { status: 403 });
                }
                if (currentStatus !== 'PENDING_REVIEW') {
                    return NextResponse.json({ error: 'Gap must be in PENDING_REVIEW to reject' }, { status: 400 });
                }
                if (!rejectionReason || rejectionReason.trim().length === 0) {
                    return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
                }
                newStatus = 'REJECTED';
                updateData.rejectionReason = rejectionReason.trim();
                updateData.approvedById = null;
                updateData.approvedAt = null;
                break;

            case 'revert':
                // Revert to DRAFT (from PENDING_REVIEW or REJECTED)
                if (!['PENDING_REVIEW', 'REJECTED'].includes(currentStatus)) {
                    return NextResponse.json({ error: 'Can only revert from PENDING_REVIEW or REJECTED' }, { status: 400 });
                }
                newStatus = 'DRAFT';
                updateData.approvedById = null;
                updateData.approvedAt = null;
                updateData.rejectionReason = null;
                break;

            default:
                return NextResponse.json({ error: 'Invalid action. Valid: submit, approve, reject, revert' }, { status: 400 });
        }

        // Validate the transition
        const allowed = VALID_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(newStatus)) {
            return NextResponse.json({
                error: `Invalid transition from ${currentStatus} to ${newStatus}`
            }, { status: 400 });
        }

        // Update the Gap
        const updatedGap = await db.gap.update({
            where: { id: gapId },
            data: {
                approvalStatus: newStatus,
                ...updateData
            }
        });

        // Log the workflow action in the ActivityLog
        await db.activityLog.create({
            data: {
                userId,
                action: `gap.workflow.${action}`,
                resource: `Gap: ${gap.title}`,
                details: JSON.stringify({
                    gapId,
                    projectId,
                    previousStatus: currentStatus,
                    newStatus,
                    rejectionReason: rejectionReason || null
                }),
                organizationId: gap.organizationId
            }
        });

        return NextResponse.json({
            success: true,
            gap: updatedGap,
            transition: { from: currentStatus, to: newStatus }
        });

    } catch (error) {
        console.error('Error during gap workflow transition:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
