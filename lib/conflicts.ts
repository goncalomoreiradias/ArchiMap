
import { db } from '@/lib/db';

export type Conflict = {
    componentId: string;
    conflictingProjects: {
        id: string;
        name: string;
        operation: string;
    }[];
};

/**
 * Detects conflicts for a specific project.
 * A conflict occurs if another ACTIVE project has modified the same component.
 */
export async function detectConflicts(projectId: string): Promise<Conflict[]> {
    // 1. Get changes for the current project
    const currentChanges = await db.projectChange.findMany({
        where: { projectId },
        select: { componentId: true, operation: true }
    });

    if (currentChanges.length === 0) return [];

    const componentIds = currentChanges.map(c => c.componentId);

    // 2. Find other active projects that have changed these components
    const conflictingChanges = await db.projectChange.findMany({
        where: {
            componentId: { in: componentIds },
            projectId: { not: projectId },
            project: {
                status: 'In Progress' // Assuming 'In Progress' is the active status
            }
        },
        include: {
            project: {
                select: { id: true, name: true }
            }
        }
    });

    // 3. Group by component
    const conflictMap = new Map<string, Conflict>();

    for (const change of conflictingChanges) {
        if (!conflictMap.has(change.componentId)) {
            conflictMap.set(change.componentId, {
                componentId: change.componentId,
                conflictingProjects: []
            });
        }

        const conflict = conflictMap.get(change.componentId)!;
        // Avoid duplicates if multiple changes exist for same component in same project
        if (!conflict.conflictingProjects.some(p => p.id === change.projectId)) {
            conflict.conflictingProjects.push({
                id: change.project.id,
                name: change.project.name,
                operation: change.operation
            });
        }
    }

    return Array.from(conflictMap.values());
}
