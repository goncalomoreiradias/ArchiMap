import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { detectConflicts } from '@/lib/conflicts';
import fs from 'fs';
import path from 'path';
import { Node, Edge } from '@xyflow/react';

interface CatalogData {
    businessCapabilities: Array<{ id: string; name: string;[key: string]: any }>;
    dataCapabilities: Array<{ id: string; name: string;[key: string]: any }>;
    abbs: Array<{ id: string; name: string;[key: string]: any }>;
    sbbs: Array<{ id: string; name: string;[key: string]: any }>;
    bians: Array<{ id: string; name: string;[key: string]: any }>;
    relationships: Array<{
        businessCapabilityId?: string;
        dataCapabilityId?: string;
        abbId?: string;
        sbbId?: string;
        bianId?: string;
        sourceId?: string;
        targetId?: string;
    }>;
}

type ViewType = 'as-is' | 'gap' | 'target';
type ComponentType = 'bc' | 'dc' | 'abb' | 'sbb';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await context.params;
        const { viewType } = await request.json() as { viewType: ViewType };
        const projectId = resolvedParams.id;

        // Get project with snapshots and changes FIRST
        const project = await db.project.findUnique({
            where: { id: projectId },
            include: {
                asIsSnapshots: true,
                targetSnapshots: true,
                changes: true
            }
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Extract all involved component IDs (from snapshots and changes)
        const involvedComponentIds = new Set<string>();
        project.asIsSnapshots.forEach(s => involvedComponentIds.add(s.catalogComponentId));
        project.changes.forEach(c => {
            involvedComponentIds.add(c.componentId);
            try {
                const data = c.componentData ? JSON.parse(c.componentData) : null;
                if (data?.sourceId) involvedComponentIds.add(data.sourceId);
                if (data?.targetId) involvedComponentIds.add(data.targetId);
            } catch (e) { }
        });

        // 1. Initialize Empty Catalog
        const catalog: CatalogData = {
            businessCapabilities: [],
            dataCapabilities: [],
            abbs: [],
            sbbs: [],
            bians: [],
            relationships: []
        };

        // 2. Fetch ONLY Involved DB Data
        const dbComponents = await db.component.findMany({
            where: {
                id: { in: Array.from(involvedComponentIds) }
            }
        });

        const dbRelationships = await db.relationship.findMany({
            where: {
                sourceComponentId: { in: Array.from(involvedComponentIds) },
                targetComponentId: { in: Array.from(involvedComponentIds) }
            }
        });

        // 3. Populate Catalog from DB
        dbComponents.forEach((comp: any) => {
            const type = comp.type.toLowerCase();
            const compData = {
                id: comp.id,
                name: comp.name,
                description: comp.description,
                layer: comp.layer,
                domainArea: comp.layer === 'Business' ? 'Custom' : undefined,
                bcL1: comp.layer === 'Business' ? comp.name : undefined,
                pattern: comp.layer === 'Data' ? 'Custom Pattern' : undefined,
                domain: comp.layer === 'Application' ? 'Custom Domain' : undefined,
                vendor: comp.layer === 'Technology' ? 'Custom Vendor' : undefined,
                version: comp.version,
                lifecycle: comp.lifecycle,
                strategicValue: comp.strategicValue,
                technicalFit: comp.technicalFit,
                complexity: comp.complexity,
                tags: comp.tags,
                metadata: comp.metadata,
                externalLink: comp.externalLink,
                validFrom: comp.validFrom,
                validTo: comp.validTo
            };

            if (comp.metadata) {
                try {
                    const meta = typeof comp.metadata === 'string' ? JSON.parse(comp.metadata) : comp.metadata;
                    Object.assign(compData, meta);
                } catch (e) { }
            }

            if (comp.layer === 'Business' || type === 'bc') catalog.businessCapabilities.push(compData);
            else if (comp.layer === 'BIAN') catalog.bians.push(compData);
            else if (comp.layer === 'Data' || type === 'dc') catalog.dataCapabilities.push(compData);
            else if (comp.layer === 'Application' || type === 'abb') catalog.abbs.push(compData);
            else if (comp.layer === 'Technology' || type === 'sbb') catalog.sbbs.push(compData);
        });

        dbRelationships.forEach((rel: any) => {
            const sourceId = rel.sourceComponentId;
            const targetId = rel.targetComponentId;

            const source = dbComponents.find(c => c.id === sourceId);
            const target = dbComponents.find(c => c.id === targetId);

            if (source && target) {
                const newRel: any = { type: rel.type };
                if (source.layer === 'Business') newRel.businessCapabilityId = sourceId;
                if (source.layer === 'BIAN') newRel.bianId = sourceId;
                if (source.layer === 'Data') newRel.dataCapabilityId = sourceId;
                if (source.layer === 'Application') newRel.abbId = sourceId;
                if (source.layer === 'Technology') newRel.sbbId = sourceId;

                if (target.layer === 'Business') newRel.businessCapabilityId = targetId;
                if (target.layer === 'BIAN') newRel.bianId = targetId;
                if (target.layer === 'Data') newRel.dataCapabilityId = targetId;
                if (target.layer === 'Application') newRel.abbId = targetId;
                if (target.layer === 'Technology') newRel.sbbId = targetId;

                newRel.sourceId = sourceId;
                newRel.targetId = targetId;

                catalog.relationships.push(newRel);
            }
        });



        // Get conflicts if in Gap view
        let conflictMap = new Set<string>();
        if (viewType === 'gap') {
            const conflicts = await detectConflicts(projectId);
            conflicts.forEach(c => conflictMap.add(c.componentId));
        }

        // Get all changes by type with full data
        const addedComponents = new Map<string, { id: string; type: ComponentType; name?: string; data?: any }>();
        const modifiedComponents = new Map<string, { id: string; data: any }>();
        const addedRelationships: any[] = [];
        const removedComponents = new Set<string>();
        const removedRelations = new Set<string>(); // Track removed edges by source-target key

        project.changes.forEach((c: any) => {
            const op = c.operation; // Changed from changeType
            let componentData = null;
            try {
                componentData = c.componentData ? JSON.parse(c.componentData) : null;
            } catch (e) { }

            if (op === 'ADD') {
                addedComponents.set(c.componentId, {
                    id: c.componentId,
                    type: c.componentType,
                    name: c.componentName || componentData?.name,
                    data: { ...componentData, changeId: c.id }
                });
            } else if (op === 'MODIFY') {
                modifiedComponents.set(c.componentId, {
                    id: c.componentId,
                    data: { ...componentData, changeId: c.id }
                });
            } else if (op === 'ADD_RELATION') {
                if (componentData && componentData.sourceId && componentData.targetId) {
                    addedRelationships.push({
                        id: c.componentId,
                        source: componentData.sourceId,
                        target: componentData.targetId,
                        label: c.description,
                        changeId: c.id
                    });
                }
            } else if (op === 'REMOVE') {
                // Check if this is a relation removal
                if (c.componentType === 'relation' || c.componentId.startsWith('REL-')) {
                    // Parse REL-source-target format and add both formats to removedRelations
                    removedRelations.add(c.componentId);
                    // Also extract source-target format
                    const match = c.componentId.match(/^REL-(.+)-(.+)$/);
                    if (match) {
                        removedRelations.add(`${match[1]}-${match[2]}`);
                    }
                } else {
                    removedComponents.add(c.componentId);
                }
            }
        });

        let nodes: Node[] = [];
        let edges: Edge[] = [];

        if (viewType === 'as-is') {
            // ===== UNIFIED LAYOUT: Use same layer-based positioning as Gap/Target =====
            const layerYPositions: Record<string, number> = {
                'BUSINESS': 50,
                'BIAN': 300,
                'APPLICATION': 550,
                'DATA': 800,
                'TECHNOLOGY': 1050
            };
            const layerCounts: Record<string, number> = {
                'BUSINESS': 0,
                'BIAN': 0,
                'APPLICATION': 0,
                'DATA': 0,
                'TECHNOLOGY': 0
            };

            // Fetch any missing components from database (not just CUSTOM-*)
            // This handles cases where components exist in snapshots but weren't loaded in the initial catalog query
            // or were added with IDs that don't match the standard patterns.
            const snapshotIds = project.asIsSnapshots.map((s: any) => s.catalogComponentId);
            const missingInCatalogIds = snapshotIds.filter((id: string) => !findInCatalog(id, catalog));

            const extraComponents = missingInCatalogIds.length > 0
                ? await db.component.findMany({
                    where: { id: { in: missingInCatalogIds } }
                })
                : [];

            // Create a lookup map for these extra components
            const extraComponentMap = new Map(extraComponents.map((c: any) => [c.id, c]));

            // Build ALL nodes from snapshots with layer-based positioning
            for (const snap of project.asIsSnapshots) {
                // Skip relationship snapshots - they should be edges, not nodes
                if (snap.catalogComponentType === 'relation' || snap.catalogComponentId.startsWith('REL-')) {
                    continue;
                }

                let comp = findInCatalog(snap.catalogComponentId, catalog);

                // If not found in main catalog, check the extra fetched components
                if (!comp) {
                    const dbComp = extraComponentMap.get(snap.catalogComponentId);
                    if (dbComp) {
                        comp = {
                            id: dbComp.id,
                            name: dbComp.name,
                            description: dbComp.description || '',
                            // Ensure we preserve other fields if needed
                            type: dbComp.type || getLayerFromType(dbComp.layer).toLowerCase() as any,
                            layer: dbComp.layer
                        } as any;
                    }
                }

                const layer = (comp as any)?.layer || getLayerFromType(snap.catalogComponentType);
                const layerKey = layer.toUpperCase();

                // Position based on layer, horizontally spaced (same as Gap/Target)
                const baseY = layerYPositions[layerKey] ?? 450;
                const col = layerCounts[layerKey] || 0;

                const x = 350 + (col * 320); // Center start + spacing
                const y = baseY;

                layerCounts[layerKey] = (layerCounts[layerKey] || 0) + 1;

                nodes.push({
                    id: snap.catalogComponentId,
                    type: 'archNode',
                    position: { x, y },
                    data: {
                        label: comp?.name || snap.catalogComponentId,
                        layer,
                        status: 'As-Is',
                        type: snap.catalogComponentType.toUpperCase(),
                        description: (comp as any)?.description || (comp as any)?.notes || snap.notes || ''
                    }
                });
            }

            // Build edges from catalog relationships (where both ends exist in nodes)
            const nodeIds = new Set(nodes.map(n => n.id));
            const edgeSet = new Set<string>();

            for (const rel of catalog.relationships) {
                // If it's a newer custom relationship with strict source/target assigned directly
                if (rel.sourceId && rel.targetId) {
                    if (!nodeIds.has(rel.sourceId) || !nodeIds.has(rel.targetId)) continue;

                    const edgeId = `${rel.sourceId}-${rel.targetId}`;
                    if (edgeSet.has(edgeId)) continue;

                    edges.push({
                        id: edgeId,
                        source: rel.sourceId,
                        target: rel.targetId,
                        type: 'smoothstep',
                        animated: false,
                        style: { stroke: '#94a3b8', strokeWidth: 2 }
                    });
                    edgeSet.add(edgeId);
                } else {
                    // Fallback to legacy structure parsing if needed...
                    const pairs = [
                        { source: rel.businessCapabilityId, target: rel.dataCapabilityId },
                        { source: rel.dataCapabilityId, target: rel.abbId },
                        { source: rel.abbId, target: rel.sbbId }
                    ];

                    for (const pair of pairs) {
                        if (!pair.source || !pair.target) continue;
                        if (!nodeIds.has(pair.source) || !nodeIds.has(pair.target)) continue;

                        const edgeId = `${pair.source}-${pair.target}`;
                        if (edgeSet.has(edgeId)) continue;

                        edges.push({
                            id: edgeId,
                            source: pair.source,
                            target: pair.target,
                            type: 'smoothstep',
                            animated: false,
                            style: { stroke: '#94a3b8', strokeWidth: 2 }
                        });
                        edgeSet.add(edgeId);
                    }
                }
            }
        } else if (viewType === 'gap' || viewType === 'target') {
            // SHARED LOGIC for Gap and Target to ensure consistency
            // 
            // KEY FIX: Do NOT use buildGraphFromBCs() which crawls all catalog relationships.
            // Instead, build nodes ONLY from:
            //   1. AS-IS snapshots (components already in project)
            //   2. Added components (from changes)
            // And edges ONLY from:
            //   1. Existing relationships between AS-IS snapshot components
            //   2. Explicitly added relationships (ADD_RELATION changes)

            // Collect valid component IDs FIRST (before building anything)
            const validComponentIds = new Set([
                ...project.asIsSnapshots.map((s: any) => s.catalogComponentId),
                ...Array.from(addedComponents.keys())
            ]);

            // Also collect snapshot relationship IDs for later edge building
            const snapshotRelationIds = new Set(
                project.asIsSnapshots
                    .filter((s: any) => s.catalogComponentType === 'relation')
                    .map((s: any) => s.catalogComponentId)
            );

            // Layer positioning
            const layerCounts: Record<string, number> = {
                'Business': 0, 'BIAN': 0, 'Data': 0, 'Application': 0, 'Technology': 0, 'Other': 0
            };
            const occupiedPositions = new Set<string>();

            // Helper to create a node - ALWAYS uses grid layout (saved positions were causing overlaps)
            const createNodeFromComponent = (id: string, comp: any, isSnapshot = false, changeStatus?: string) => {
                if (viewType === 'target' && removedComponents.has(id)) return null;

                const rawType = comp.type || (comp as any).catalogComponentType || 'bc';
                const layer = (typeof comp.data === 'object' ? comp.data?.layer : undefined) || getLayerFromType(rawType);
                const layerKey = ['Business', 'BIAN', 'Data', 'Application', 'Technology'].includes(layer) ? layer : 'Other';

                let baseY = getYOffsetForLayer(layerKey);
                if (layerKey === 'Other') baseY = 1000;

                // Grid layout constants
                const NODE_WIDTH = 280;
                const NODE_HEIGHT = 180;
                const H_GAP = 60;
                const V_GAP = 70;
                const COLS_PER_ROW = 5;

                // Calculate grid position based on current layer count
                const currentIndex = layerCounts[layerKey];
                const col = currentIndex % COLS_PER_ROW;
                const row = Math.floor(currentIndex / COLS_PER_ROW);

                const x = col * (NODE_WIDTH + H_GAP);
                const y = baseY + (row * (NODE_HEIGHT + V_GAP));

                // Increment layer count for next node
                layerCounts[layerKey]++;

                // Parse data for label extraction
                let parsedData: any = comp.data;
                try {
                    if (typeof comp.data === 'string') {
                        parsedData = JSON.parse(comp.data);
                    }
                } catch (e) { /* ignore parse error */ }

                let label = comp.name || parsedData?.name || (typeof comp.data === 'object' ? comp.data?.name : null);
                if (!label) {
                    const catalogComp = findInCatalog(id, catalog);
                    label = catalogComp?.name || id;
                }

                // Determine changeStatus for Gap view
                let nodeChangeStatus = changeStatus;
                if (viewType === 'gap' && !nodeChangeStatus) {
                    if (removedComponents.has(id)) {
                        nodeChangeStatus = 'removed';
                    } else if (addedComponents.has(id)) {
                        nodeChangeStatus = 'added';
                    } else if (modifiedComponents.has(id)) {
                        nodeChangeStatus = 'modified';
                    }
                }

                return {
                    id,
                    type: 'archNode',
                    position: { x, y },
                    data: {
                        label,
                        layer,
                        status: isSnapshot ? 'As-Is' : 'Target',
                        type: (comp.type || (comp as any).catalogComponentType || 'bc').toUpperCase(),
                        description: comp.data?.description || '',
                        changeStatus: nodeChangeStatus,
                        hasConflict: conflictMap.has(id),

                        // New Fields
                        version: comp.version || comp.data?.version,
                        lifecycle: comp.lifecycle || comp.data?.lifecycle,
                        strategicValue: comp.strategicValue || comp.data?.strategicValue,
                        technicalFit: comp.technicalFit || comp.data?.technicalFit,
                        complexity: comp.complexity || comp.data?.complexity,
                        tags: comp.tags || comp.data?.tags,
                        metadata: comp.metadata || comp.data?.metadata,
                        externalLink: comp.externalLink || comp.data?.externalLink
                    }
                };
            };

            // 1. Build Nodes from AS-IS Snapshots (non-relation items)
            for (const snap of project.asIsSnapshots) {
                if (snap.catalogComponentType === 'relation') continue; // Skip relations, handle separately

                const comp = findInCatalog(snap.catalogComponentId, catalog) || { name: snap.catalogComponentId };
                const node = createNodeFromComponent(snap.catalogComponentId, { ...snap, ...comp }, true);
                if (node) nodes.push(node);
            }

            // 2. Build Nodes from Added Components
            for (const [id, comp] of addedComponents) {
                if (nodes.find(n => n.id === id)) continue; // Skip if already added from snapshot
                const node = createNodeFromComponent(id, comp, false);
                if (node) nodes.push(node);
            }

            // 3. Build Edges - ONLY from valid sources:
            //    a) Catalog relationships where BOTH source AND target are in validComponentIds
            //    b) Snapshot relationships (if we stored them)
            //    c) Explicitly added relationships (ADD_RELATION changes)

            const edgeSet = new Set<string>();

            // 3a. Catalog relationships (STRICT: both ends must be in project context)
            for (const rel of catalog.relationships) {
                // Handle modern sourceId/targetId format (from DB)
                if (rel.sourceId && rel.targetId) {
                    if (!validComponentIds.has(rel.sourceId) || !validComponentIds.has(rel.targetId)) continue;

                    const edgeId = `${rel.sourceId}-${rel.targetId}`;
                    if (edgeSet.has(edgeId)) continue;

                    const isExplicitlyRemoved = removedRelations.has(edgeId) || removedRelations.has(`REL-${edgeId}`);
                    const isNodeRemoved = removedComponents.has(rel.sourceId) || removedComponents.has(rel.targetId);
                    const isRemoved = isExplicitlyRemoved || isNodeRemoved;

                    if (viewType === 'target' && isRemoved) continue;

                    edges.push({
                        id: edgeId,
                        source: rel.sourceId,
                        target: rel.targetId,
                        type: 'smoothstep',
                        animated: false,
                        style: isRemoved
                            ? { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '4', opacity: 0.6 }
                            : { stroke: '#94a3b8', strokeWidth: 2 },
                        data: { changeStatus: isRemoved ? 'removed' : undefined }
                    });
                    edgeSet.add(edgeId);
                    continue;
                }

                // Fallback: legacy {businessCapabilityId, dataCapabilityId} structure
                // Build possible edges from this relationship row
                const pairs = [
                    { source: rel.businessCapabilityId, target: rel.dataCapabilityId },
                    { source: rel.dataCapabilityId, target: rel.abbId },
                    { source: rel.abbId, target: rel.sbbId }
                ];

                for (const pair of pairs) {
                    if (!pair.source || !pair.target) continue;

                    // STRICT CHECK: Both must be in project context
                    if (!validComponentIds.has(pair.source) || !validComponentIds.has(pair.target)) continue;

                    const edgeId = `${pair.source}-${pair.target}`;
                    if (edgeSet.has(edgeId)) continue;

                    // Check if edge is explicitly removed OR if connected nodes are removed
                    const isExplicitlyRemoved = removedRelations.has(edgeId) || removedRelations.has(`REL-${edgeId}`);
                    const isNodeRemoved = removedComponents.has(pair.source) || removedComponents.has(pair.target);
                    const isRemoved = isExplicitlyRemoved || isNodeRemoved;

                    if (viewType === 'target' && isRemoved) continue;

                    edges.push({
                        id: edgeId,
                        source: pair.source,
                        target: pair.target,
                        type: 'smoothstep',
                        animated: false,
                        style: isRemoved ? { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '4', opacity: 0.6 } : { stroke: '#94a3b8', strokeWidth: 2 },
                        data: { changeStatus: isRemoved ? 'removed' : undefined }
                    });
                    edgeSet.add(edgeId);
                }
            }

            // 3c. Explicitly added relationships (ADD_RELATION changes)
            for (const rel of addedRelationships) {
                if (viewType === 'target') {
                    if (removedComponents.has(rel.source) || removedComponents.has(rel.target)) continue;
                }

                // Only add if both nodes exist in our graph
                if (!nodes.find(n => n.id === rel.source) || !nodes.find(n => n.id === rel.target)) continue;

                const edgeId = `${rel.source}-${rel.target}`;
                if (edgeSet.has(edgeId)) continue;

                // Skip if this relationship was removed - UNLESS in GAP view
                const isExplicitlyRemoved = removedRelations.has(edgeId) || removedRelations.has(rel.id);
                // Also check if endpoints are removed (if node is removed, edge should look removed)
                const isNodeRemoved = removedComponents.has(rel.source) || removedComponents.has(rel.target);
                const isRemoved = isExplicitlyRemoved || isNodeRemoved;

                if (isRemoved) {
                    if (viewType === 'target') continue;
                    // In GAP, show as removed
                }

                edges.push({
                    id: rel.id || edgeId,
                    source: rel.source,
                    target: rel.target,
                    type: 'smoothstep',
                    animated: !isRemoved && viewType === 'gap',
                    style: {
                        stroke: isRemoved ? '#ef4444' : (viewType === 'gap' ? '#22c55e' : '#94a3b8'),
                        strokeWidth: 2,
                        strokeDasharray: isRemoved || viewType === 'gap' ? '5,5' : undefined,
                        opacity: isRemoved ? 0.6 : 1
                    },
                    data: {
                        changeStatus: isRemoved ? 'removed' : 'added',
                        changeId: rel.changeId
                    }
                });
                edgeSet.add(edgeId);
            }

            // 4. Apply change status flags to nodes
            nodes = nodes.map(node => {
                const isAdded = addedComponents.has(node.id);
                const isRemoved = removedComponents.has(node.id);
                const isModified = modifiedComponents.has(node.id);
                const hasConflict = conflictMap.has(node.id);

                let nodeData = { ...node.data };
                if (isModified) {
                    const mod = modifiedComponents.get(node.id);
                    if (mod) nodeData = { ...nodeData, ...mod.data };
                }

                return {
                    ...node,
                    data: {
                        ...nodeData,
                        changeStatus: isAdded ? 'added' : isRemoved ? 'removed' : isModified ? 'modified' : 'unchanged',
                        changeId: isAdded ? addedComponents.get(node.id)?.data?.changeId :
                            isModified ? modifiedComponents.get(node.id)?.data?.changeId :
                                isRemoved ? project.changes.find((c: any) => c.operation === 'REMOVE' && c.componentId === node.id)?.id : undefined,
                        hasConflict
                    }
                };
            });

            // 5. Final filter for Target view - remove nodes marked as removed
            if (viewType === 'target') {
                nodes = nodes.filter(n => !removedComponents.has(n.id));
                // Edges already filtered above during creation
            }

            // 6. Remove explicitly removed relationships
            edges = edges.filter(e => !removedComponents.has(e.id));

            // 7. FINAL VALIDATION: Remove edges that reference non-existent nodes
            const finalNodeIds = new Set(nodes.map(n => n.id));
            edges = edges.filter(e => finalNodeIds.has(e.source) && finalNodeIds.has(e.target));
        }



        return NextResponse.json({ nodes, edges, viewType });
    } catch (error) {
        console.error('Error building project view:', error);
        return NextResponse.json(
            { error: 'Failed to build project view' },
            { status: 500 }
        );
    }
}

function findInCatalog(id: string, catalog: CatalogData) {
    let found = catalog.businessCapabilities.find(c => c.id === id);
    if (found) return { ...found, type: 'bc' };

    found = catalog.dataCapabilities.find(c => c.id === id);
    if (found) return { ...found, type: 'dc' };

    found = catalog.abbs.find(c => c.id === id);
    if (found) return { ...found, type: 'abb' };

    found = catalog.sbbs.find(c => c.id === id);
    if (found) return { ...found, type: 'sbb' };

    found = catalog.bians.find(c => c.id === id);
    if (found) return { ...found, type: 'bian' };

    return null;
}

function getLayerFromType(type: string | undefined | null): string {
    if (!type) return 'Business';
    const t = type.toLowerCase();
    if (t === 'bc' || t.includes('business')) return 'Business';
    if (t === 'bian' || t.includes('service') || t.includes('domain') || t.includes('object') || t.includes('operation')) return 'BIAN';
    if (t === 'dc' || t.includes('data') || t.includes('api') || t.includes('entity') || t.includes('flow')) return 'Data';
    if (t === 'abb' || t.includes('application') || t.includes('interface')) return 'Application';
    if (t === 'sbb' || t.includes('technology') || t.includes('infrastructure') || t.includes('platform')) return 'Technology';
    return 'Business';
}

function getYOffsetForLayer(layer: string): number {
    switch (layer) {
        case 'Business': return 0;
        case 'BIAN': return 250;
        case 'Application': return 500;
        case 'Data': return 750;
        case 'Technology': return 1000;
        default: return 0;
    }
}


