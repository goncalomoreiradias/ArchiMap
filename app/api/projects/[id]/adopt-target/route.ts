import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ... imports
import { detectConflicts } from '@/lib/conflicts';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Fix params type
) {
    try {
        const { id: projectId } = await context.params;

        // Parse optional body for status update
        let body = {};
        try {
            body = await request.json();
        } catch (e) { }
        const { status } = body as { status?: string };

        let userId = request.cookies.get("userId")?.value;

        // Verify user exists
        if (userId) {
            const userExists = await db.user.findUnique({ where: { id: userId } });
            if (!userExists) userId = undefined;
        }

        if (!userId) {
            // Fallback to system user
            let systemUser = await db.user.findUnique({ where: { username: 'system' } });
            if (!systemUser) {
                systemUser = await db.user.create({
                    data: {
                        username: 'system',
                        email: 'system@enterprisearg.com',
                        passwordHash: 'system',
                        role: 'Admin'
                    }
                });
            }
            userId = systemUser.id;
        }

        // 1. Check for Conflicts
        const conflicts = await detectConflicts(projectId);
        if (conflicts.length > 0) {
            return NextResponse.json({
                error: 'Cannot adopt due to active conflicts',
                conflicts
            }, { status: 409 });
        }

        // 2. Perform Atomic Adoption
        const result = await db.$transaction(async (tx) => {
            // Fetch all changes
            const changes = await tx.projectChange.findMany({
                where: { projectId }
            });

            if (changes.length === 0) {
                // If no changes, just close the project? Or maybe allow adoption of empty?
                // For now, let's proceed but log it.
            }

            for (const change of changes) {
                const data = change.componentData ? JSON.parse(change.componentData) : {};

                if (change.operation === 'MODIFY') {
                    // Archive current version
                    const currentComponent = await tx.component.findUnique({
                        where: { id: change.componentId }
                    });

                    if (currentComponent) {
                        const lastHistory = await tx.componentHistory.findFirst({
                            where: { componentId: change.componentId },
                            orderBy: { version: 'desc' }
                        });
                        const nextVersion = (lastHistory?.version || 0) + 1;

                        await tx.componentHistory.create({
                            data: {
                                componentId: change.componentId,
                                projectId, // Traceability
                                version: nextVersion,
                                snapshot: JSON.stringify(currentComponent),
                                changedBy: userId,
                            }
                        });
                    }

                    // Update Component - Sanitize data
                    const { name, description, ...others } = data;
                    // Only update known fields
                    await tx.component.update({
                        where: { id: change.componentId },
                        data: {
                            name: name,
                            description: description,
                            updatedAt: new Date()
                        }
                    });

                } else if (change.operation === 'ADD') {
                    // Create Component - check if already exists to be safe (idempotency)
                    const exists = await tx.component.findUnique({ where: { id: change.componentId } });
                    if (!exists) {
                        // Sanitize data
                        const { name, layer, type, description, criticality, owner } = data;
                        await tx.component.create({
                            data: {
                                id: change.componentId,
                                name: name || 'New Component',
                                layer: layer || 'Business',
                                type: change.componentType,
                                status: 'As-Is',
                                description: description || null,
                                criticality: criticality || 'Medium',
                                owner: owner || null,
                                createdById: userId
                            }
                        });
                    }

                } else if (change.operation === 'ADD_RELATION') {
                    // Handle Relationship Creation
                    const { sourceId, targetId, type } = data;
                    if (sourceId && targetId) {
                        // Check if relationship already exists to prevent duplicates
                        const existingRel = await tx.relationship.findFirst({
                            where: {
                                sourceComponentId: sourceId,
                                targetComponentId: targetId
                            }
                        });

                        if (!existingRel) {
                            await tx.relationship.create({
                                data: {
                                    sourceComponentId: sourceId,
                                    targetComponentId: targetId,
                                    type: type || 'Composition',
                                    description: change.description || null
                                }
                            });
                        }
                    }

                } else if (change.operation === 'REMOVE') {
                    if (change.componentType === 'relation') {
                        // Hard Delete Relationship
                        // Use try-catch or findUnique to avoid crash if already deleted
                        const exists = await tx.relationship.findUnique({ where: { id: change.componentId } });
                        if (exists) {
                            await tx.relationship.delete({ where: { id: change.componentId } });
                        }
                    } else {
                        // Soft Delete Component
                        await tx.component.update({
                            where: { id: change.componentId },
                            data: { status: 'Retired', updatedAt: new Date() }
                        });
                    }
                }
            }


            // 3. Update Project Snapshots to reflect the new AS-IS state
            // Fetch current AS-IS snapshots
            const currentSnapshots = await tx.projectSnapshot.findMany({
                where: { projectId, snapshotType: 'AS-IS' }
            });

            const currentIds = new Set(currentSnapshots.map(s => s.catalogComponentId));
            const addedIds = new Set<string>();
            const removedIds = new Set<string>();

            // changes is already declared above
            changes.forEach(c => {
                if (c.operation === 'ADD') {
                    addedIds.add(c.componentId);
                } else if (c.operation === 'REMOVE') {
                    removedIds.add(c.componentId);
                }
            });

            // Calculate new set: (Start U Add) - Remove
            // Note: If something was added then removed, it shouldn't be here.
            // If something was removed then added, it should be here.
            // But strict set logic:
            const finalIds = new Set([...currentIds]);
            addedIds.forEach(id => finalIds.add(id));
            removedIds.forEach(id => finalIds.delete(id));

            // To update accurately:
            // 1. Identify what to delete (in current but not in final)
            // 2. Identify what to add (in final but not in current)

            const toDelete = currentSnapshots.filter(s => !finalIds.has(s.catalogComponentId)).map(s => s.id);
            const toAdd = Array.from(finalIds).filter(id => !currentIds.has(id));

            if (toDelete.length > 0) {
                await tx.projectSnapshot.deleteMany({
                    where: { id: { in: toDelete } }
                });
            }


            // We need component types for new snapshots.
            // For existing components (from Adds), we can look them up or infer.
            // Since we just created/updated the components in step 2, we can query them or use change metadata.
            // Efficient way: just fetch the type from the 'changes' or fetch from DB if needed.
            // But 'changes' has componentType.

            for (const id of toAdd) {
                // Find the change that added this, to get the type
                const change = changes.find(c => c.componentId === id && c.operation === 'ADD');
                const type = change?.componentType || 'bc'; // Fallback? Or fetch from DB?

                await tx.projectSnapshot.create({
                    data: {
                        projectId,
                        snapshotType: 'AS-IS',
                        catalogComponentId: id,
                        catalogComponentType: type,
                        addedAt: new Date()
                    }
                });
            }

            // NOTE: Relationships are NOT stored as snapshots.
            // They are derived from:
            // 1. Catalog relationships table (for catalog components)
            // 2. ADD_RELATION changes (for explicitly added relationships)
            // Creating snapshots for relations was incorrect - it caused them to appear as cards.

            // Clean up changes
            await tx.projectChange.deleteMany({
                where: { projectId }
            });

            // Update Project Status
            const updatedProject = await tx.project.update({
                where: { id: projectId },
                data: {
                    status: status || 'Completed',
                    currentState: 'AS-IS', // Reset state
                    endDate: new Date()
                }
            });

            // Re-snapshot the new AS-IS state for this project?? 
            // The user logic implies the project ends here.
            // But if it were to continue, we'd need new snapshots.
            // Since we close it, we don't strictly need new snapshots *for this project*.
            // But for *future* projects, they will read the catalog.

            return { count: changes.length, project: updatedProject };
        });

        return NextResponse.json({
            success: true,
            message: 'Target state adopted successfully',
            details: result
        });

    } catch (error) {
        console.error('[Adopt Target] Error:', error);
        return NextResponse.json(
            { error: 'Failed to adopt target', details: String(error) },
            { status: 500 }
        );
    }
}
