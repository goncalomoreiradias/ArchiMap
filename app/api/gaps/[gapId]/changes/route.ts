
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireEditor } from '@/lib/auth-utils';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ gapId: string }> }
) {
    try {
        const { gapId } = await params;

        // Auth check
        const authResult = await requireEditor();
        if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

        const body = await request.json();
        const { changeIds, action } = body; // action: 'assign' | 'unassign'
        console.log(`API [PUT /api/gaps/${gapId}/changes] Action: ${action}, IDs:`, changeIds);

        if (!changeIds || !Array.isArray(changeIds)) {
            return NextResponse.json({ error: "Invalid changeIds" }, { status: 400 });
        }

        if (action === 'assign' || action === 'assignPhase') {
            // First, get the components associated with these changeIds
            const changes = await db.projectChange.findMany({
                where: { id: { in: changeIds } },
                select: { componentId: true, projectId: true }
            });

            const componentIds = changes.map(c => c.componentId);
            const projectId = changes[0]?.projectId;

            let allChangeIdsToUpdate = [...changeIds];

            if (projectId && componentIds.length > 0) {
                // Find all ADD_RELATION changes in this project
                const relations = await db.projectChange.findMany({
                    where: {
                        projectId: projectId,
                        operation: 'ADD_RELATION'
                    }
                });

                // Filter to relations where either source or target is in our selected components
                // (Or both, but usually if we pull one end into a gap, the relation should follow if it's new)
                relations.forEach(rel => {
                    if (rel.componentData) {
                        try {
                            const data = JSON.parse(rel.componentData);
                            if (componentIds.includes(data.sourceId) || componentIds.includes(data.targetId)) {
                                if (!allChangeIdsToUpdate.includes(rel.id)) {
                                    allChangeIdsToUpdate.push(rel.id);
                                }
                            }
                        } catch (e) { }
                    }
                });
            }

            if (action === 'assign') {
                const result = await db.projectChange.updateMany({
                    where: { id: { in: allChangeIdsToUpdate } },
                    data: { gapId: gapId }
                });
                console.log(`API: Assigned ${result.count} changes (including auto-relations) to gap ${gapId}`);
            } else if (action === 'assignPhase') {
                const { gapPhaseId } = body;
                if (!gapPhaseId) return NextResponse.json({ error: "Missing gapPhaseId" }, { status: 400 });

                await db.projectChange.updateMany({
                    where: { id: { in: allChangeIdsToUpdate } },
                    data: { gapId: gapId, gapPhaseId: gapPhaseId }
                });
            }
        } else if (action === 'unassign') {
            await db.projectChange.updateMany({
                where: { id: { in: changeIds }, gapId: gapId },
                data: { gapId: null, gapPhaseId: null } // Clear both
            });
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating change assignments:", error);
        return NextResponse.json({ error: "Failed to update assignments" }, { status: 500 });
    }
}
