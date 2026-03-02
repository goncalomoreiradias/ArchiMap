import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string, componentId: string }> }
) {
    try {
        const { id: projectId, componentId } = await context.params;

        // 1. Fetch Project and its changes + snapshots
        const project = await db.project.findUnique({
            where: { id: projectId },
            include: {
                asIsSnapshots: true,
                changes: true
            }
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // 2. We want to find Application components that relate to this componentId.
        // Usually Applicaiton -> BIAN, or BIAN -> Application.
        // Let's gather all base Relationships from the Catalog involving this componentId
        const catalogRels = await db.relationship.findMany({
            where: {
                OR: [
                    { sourceComponentId: componentId },
                    { targetComponentId: componentId }
                ]
            }
        });

        // 3. Gather components involved in the AS-IS state
        // AS-IS components are those in project.asIsSnapshots
        const asIsComponentIds = new Set(project.asIsSnapshots.map(s => s.catalogComponentId));

        // AS-IS active relationships for this component:
        // A relation is active AS-IS if BOTH source and target are in the AS-IS snapshots
        const asIsRelations = catalogRels.filter(r =>
            asIsComponentIds.has(r.sourceComponentId) && asIsComponentIds.has(r.targetComponentId)
        );

        // 4. Calculate TARGET state
        // Target = (AS-IS + ADD) - REMOVE
        const addedComponentIds = new Set(
            project.changes.filter(c => c.operation === 'ADD').map(c => c.componentId)
        );
        const removedComponentIds = new Set(
            project.changes.filter(c => c.operation === 'REMOVE').map(c => c.componentId)
        );

        const targetComponentIds = new Set(
            [...asIsComponentIds, ...addedComponentIds].filter(id => !removedComponentIds.has(id))
        );

        // Added Relations from ProjectChanges
        const addedRelations: any[] = [];
        const removedRelations = new Set(
            project.changes
                .filter(c => c.operation === 'REMOVE' && c.componentType === 'relation')
                .map(c => c.componentId) // This might be "REL-source-target"
        );

        project.changes.forEach(c => {
            if (c.operation === 'ADD_RELATION') {
                try {
                    const data = c.componentData ? JSON.parse(c.componentData) : {};
                    if ((data.sourceId === componentId || data.targetId === componentId)) {
                        addedRelations.push({
                            id: c.componentId,
                            sourceComponentId: data.sourceId,
                            targetComponentId: data.targetId
                        });
                    }
                } catch (e) { }
            }
            if (c.operation === 'REMOVE' && c.componentType === 'relation') {
                // Parse REL-s-t
                const match = c.componentId.match(/^REL-(.+)-(.+)$/);
                if (match) {
                    if (match[1] === componentId || match[2] === componentId) {
                        removedRelations.add(c.componentId);
                        removedRelations.add(`${match[1]}-${match[2]}`);
                    }
                }
            }
        });

        // Target active relationships
        // It includes AS-IS relations that are NOT removed, AND newly ADDED relations,
        // PROVIDED both endpoints are in targetComponentIds
        const targetRelations = [
            ...asIsRelations.filter(r =>
                !removedRelations.has(r.id) &&
                !removedRelations.has(`REL-${r.sourceComponentId}-${r.targetComponentId}`) &&
                !removedRelations.has(`${r.sourceComponentId}-${r.targetComponentId}`)
            ),
            ...addedRelations
        ].filter(r =>
            targetComponentIds.has(r.sourceComponentId) && targetComponentIds.has(r.targetComponentId)
        );

        // 5. Gather unique component IDs we need to fetch info about
        // (the other end of the relationship)
        const relevantComponentIds = new Set<string>();
        for (const r of asIsRelations) {
            relevantComponentIds.add(r.sourceComponentId === componentId ? r.targetComponentId : r.sourceComponentId);
        }
        for (const r of targetRelations) {
            relevantComponentIds.add(r.sourceComponentId === componentId ? r.targetComponentId : r.sourceComponentId);
        }

        // Fetch details of those components from Catalog AND from ProjectChanges
        const dbComponents = await db.component.findMany({
            where: { id: { in: Array.from(relevantComponentIds) } }
        });

        const componentDetails = new Map();
        dbComponents.forEach(c => componentDetails.set(c.id, c));

        // Overlay added names
        project.changes.forEach(c => {
            if (c.operation === 'ADD' && relevantComponentIds.has(c.componentId)) {
                try {
                    const data = c.componentData ? JSON.parse(c.componentData) : {};
                    componentDetails.set(c.componentId, {
                        id: c.componentId,
                        name: c.componentName || data.name || c.componentId,
                        layer: data.layer || 'Application',
                        type: c.componentType
                    });
                } catch (e) { }
            }
        });

        // 6. Build response
        // Mapped AS-IS
        const asIsMapping = asIsRelations.map(r => {
            const relatedId = r.sourceComponentId === componentId ? r.targetComponentId : r.sourceComponentId;
            const comp = componentDetails.get(relatedId);
            return {
                id: relatedId,
                name: comp?.name || relatedId,
                layer: comp?.layer || 'Unknown'
            };
        });

        // Mapped TARGET
        const targetMapping = targetRelations.map(r => {
            const relatedId = r.sourceComponentId === componentId ? r.targetComponentId : r.sourceComponentId;
            const comp = componentDetails.get(relatedId);
            return {
                id: relatedId,
                name: comp?.name || relatedId,
                layer: comp?.layer || 'Unknown'
            };
        });

        // Calculate Deltas
        const asIsIds = new Set(asIsMapping.map(m => m.id));
        const targetIds = new Set(targetMapping.map(m => m.id));

        const addedMapping = targetMapping.filter(m => !asIsIds.has(m.id));
        const removedMapping = asIsMapping.filter(m => !targetIds.has(m.id));
        const unchangedMapping = asIsMapping.filter(m => targetIds.has(m.id));

        return NextResponse.json({
            asIs: asIsMapping,
            target: targetMapping,
            delta: {
                added: addedMapping,
                removed: removedMapping,
                unchanged: unchangedMapping
            }
        });

    } catch (error) {
        console.error('Error fetching mapping:', error);
        return NextResponse.json(
            { error: 'Failed to fetch mapping' },
            { status: 500 }
        );
    }
}
