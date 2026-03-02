import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Node, Edge } from '@xyflow/react';
import { getComponentLifecycleUpdates } from '@/lib/roadmap';

type ComponentType = 'bc' | 'dc' | 'abb' | 'sbb';
type Layer = 'Business' | 'Data' | 'Application' | 'Technology';

// Helper to determine layer/type if not present (fallback)
function getLayerAndType(comp: any) {
    let layer = comp.layer;
    let type = comp.type;
    // Map if needed, but DB should have correct values
    return { layer, type };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let selectedComponents: { id: string; type: string }[] = [];

        if (body.components && Array.isArray(body.components)) {
            selectedComponents = body.components;
        } else if (body.componentId && body.componentType) {
            selectedComponents = [{ id: body.componentId, type: body.componentType }];
        } else {
            return NextResponse.json(
                { error: 'components array or componentId/Type required' },
                { status: 400 }
            );
        }

        if (selectedComponents.length === 0) {
            return NextResponse.json({ nodes: [], edges: [] });
        }

        const selectedIds = new Set(selectedComponents.map(c => c.id));

        // 2. Recursive Downstream Search (BFS)
        const allComponentIds = new Set<string>();
        const allRelationshipIds = new Set<string>();

        // Initialize with selected components
        let currentLevelIds = new Set(selectedIds);
        selectedIds.forEach(id => allComponentIds.add(id));

        // Calculate effective lifecycle updates from roadmaps
        // This now returns updates for existing items AND completely new items
        const { roadmapUpdates, createdNodes, createdEdges } = await getComponentLifecycleUpdates();
        console.log(`Debug Graph: ${createdNodes.size} createdNodes, ${createdEdges.size} createdEdges.`);

        // MERGE created edges with existing relationships for traversal
        // createdEdges is a Map<string, any>. Convert to array.
        const futureEdges = Array.from(createdEdges.values()).map(e => ({
            id: e.id,
            sourceComponentId: e.sourceComponentId,
            targetComponentId: e.targetComponentId,
            type: e.type,
            isFuture: true // Flag to identify
        }));
        console.log(`Debug Graph: futureEdges prepared: ${futureEdges.length}`);

        // Fetch all relationships once for performance (in-memory filtering is faster for this dataset size)
        const existingRelationships = await db.relationship.findMany();

        // Combine for traversal
        const allRelationships = [...existingRelationships, ...futureEdges];

        let iterationDown = 0;
        const MAX_DEPTH = 10; // Safety break

        const downstreamComponentIds = new Set<string>(selectedIds);
        const upstreamComponentIds = new Set<string>(selectedIds);

        // Pass 1: Downstream Search (Find targets)
        let downstreamLevelIds = new Set(selectedIds);

        while (downstreamLevelIds.size > 0 && iterationDown < MAX_DEPTH) {
            const nextLevelIds = new Set<string>();
            const downstreamRels = allRelationships.filter(rel =>
                downstreamLevelIds.has(rel.sourceComponentId) && !allRelationshipIds.has(rel.id)
            );

            downstreamRels.forEach(rel => {
                allRelationshipIds.add(rel.id);
                if (!downstreamComponentIds.has(rel.targetComponentId)) {
                    downstreamComponentIds.add(rel.targetComponentId);
                    nextLevelIds.add(rel.targetComponentId);
                }
            });

            downstreamLevelIds = nextLevelIds;
            iterationDown++;
        }

        // Pass 2: Upstream Search (Find sources)
        // Reset relationship tracking for the upward pass so edges can be traversed if needed,
        // though typically they shouldn't overlap much. It's safer to keep them distinct.
        const upRelationshipIds = new Set<string>();
        let upstreamLevelIds = new Set(selectedIds);
        let iterationUp = 0;

        while (upstreamLevelIds.size > 0 && iterationUp < MAX_DEPTH) {
            const nextLevelIds = new Set<string>();
            const upstreamRels = allRelationships.filter(rel =>
                upstreamLevelIds.has(rel.targetComponentId) && !upRelationshipIds.has(rel.id)
            );

            upstreamRels.forEach(rel => {
                upRelationshipIds.add(rel.id);
                // Also add to global relationship tracker so the final edge rendering grabs it
                allRelationshipIds.add(rel.id);

                if (!upstreamComponentIds.has(rel.sourceComponentId)) {
                    upstreamComponentIds.add(rel.sourceComponentId);
                    nextLevelIds.add(rel.sourceComponentId);
                }
            });

            upstreamLevelIds = nextLevelIds;
            iterationUp++;
        }

        // Combine the results
        upstreamComponentIds.forEach(id => allComponentIds.add(id));
        downstreamComponentIds.forEach(id => allComponentIds.add(id));

        const relevantComponentIds = allComponentIds;
        console.log(`Debug Graph: Total relevant IDs: ${relevantComponentIds.size}`);

        // Filter relationships to only those where both ends are in our set
        const finalRelationships = allRelationships.filter(rel =>
            relevantComponentIds.has(rel.sourceComponentId) && relevantComponentIds.has(rel.targetComponentId)
        );

        const components = await db.component.findMany({
            where: {
                id: { in: Array.from(relevantComponentIds) }
            }
        });

        // Add FUTURE nodes to the components array if they were discovered during traversal
        // (i.e., if their ID is in relevantComponentIds but not in the DB results)

        relevantComponentIds.forEach(id => {
            if (!components.find(c => c.id === id)) {
                // Not in DB, check if it's a future node
                const futureNode = createdNodes.get(id);
                // Allow strict check from roadmap.ts to govern validity, but double check here if needed
                if (futureNode) {
                    // It's a valid future component!
                    components.push({
                        ...futureNode,
                        // Ensure required fields for rendering are present
                        metadata: JSON.stringify(futureNode.metadata || {}), // Mock metadata string if needed
                        componentHistory: []
                    } as any);
                }
            }
        });

        // Build Nodes
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const addedNodeIds = new Set<string>();

        // Layout Helpers
        const layerOrder: Record<string, number> = { 'Business': 0, 'BIAN': 1, 'Application': 2, 'Data': 3, 'Technology': 4 };
        const layerCounts: Record<string, number> = { 'Business': 0, 'BIAN': 0, 'Data': 0, 'Application': 0, 'Technology': 0, 'Other': 0 };
        const NODE_WIDTH = 300;
        const LAYER_HEIGHT = 250;

        // Sort components by layer for layout
        components.sort((a, b) => {
            const lA = layerOrder[a.layer as string] ?? 5;
            const lB = layerOrder[b.layer as string] ?? 5;
            return lA - lB;
        });

        components.forEach(comp => {
            const layerKey = (comp.layer as string) || 'Other';
            const x = (layerCounts[layerKey] || 0) * NODE_WIDTH;
            const y = (layerOrder[layerKey] ?? 5) * LAYER_HEIGHT;

            // Increment count
            layerCounts[layerKey] = (layerCounts[layerKey] || 0) + 1;

            let metadata: any = {};
            try { if (comp.metadata) metadata = JSON.parse(comp.metadata); } catch (e) { }

            // Apply roadmap updates
            const updates = roadmapUpdates.get(comp.id);
            const validFrom = updates?.validFrom || comp.validFrom;
            const validTo = updates?.validTo || comp.validTo;

            nodes.push({
                id: comp.id,
                type: 'archNode',
                position: { x, y },
                data: {
                    label: comp.name,
                    layer: comp.layer,
                    type: comp.type,
                    status: comp.status,
                    description: comp.description,
                    // Standard Fields
                    version: comp.version,
                    lifecycle: comp.lifecycle,
                    strategicValue: comp.strategicValue,
                    technicalFit: comp.technicalFit,
                    complexity: comp.complexity,
                    tags: comp.tags,
                    externalLink: comp.externalLink,
                    validFrom: validFrom,
                    validTo: validTo,
                    // Pass ALL metadata fields to ensure frontend has access to everything
                    ...metadata
                }
            });
            addedNodeIds.add(comp.id);
        });

        // Build Edges
        finalRelationships.forEach(rel => {
            if (addedNodeIds.has(rel.sourceComponentId) && addedNodeIds.has(rel.targetComponentId)) {
                edges.push({
                    id: rel.id,
                    source: rel.sourceComponentId,
                    target: rel.targetComponentId,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#9ca3af', strokeWidth: 2 },
                    label: rel.type
                });
            }
        });

        return NextResponse.json({ nodes, edges });

    } catch (error) {
        console.error('Error building graph:', error);
        return NextResponse.json(
            { error: 'Failed to build graph' },
            { status: 500 }
        );
    }
}
