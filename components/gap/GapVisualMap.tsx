
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Panel,
    useReactFlow,
    ReactFlowProvider,
    Node,
    Edge,
    useNodesState,
    useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GapNode } from './GapNode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const nodeTypes = {
    gapNode: GapNode,
};

interface GapVisualMapProps {
    project: any
    gaps: any[]
    onAssignChange?: (changeIds: string[], gapId: string, gapPhaseId?: string) => Promise<void>
    selectedGapId?: string
    // Selection Mode Props
    selectionMode?: "view" | "multi"
    selectedIds?: string[]
    onSelectionChange?: (ids: string[]) => void
}

function GapVisualMapContent({ project, gaps, onAssignChange, selectedGapId, selectionMode = "view", selectedIds = [], onSelectionChange }: GapVisualMapProps) {
    const { fitView } = useReactFlow();
    const [selectedNode, setSelectedNode] = useState<Node | null>(null)
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
    const [selectedGap, setSelectedGap] = useState<string>(selectedGapId || "")
    const [selectedPhase, setSelectedPhase] = useState<string>("")
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);


    const activeGap = useMemo(() => gaps.find(g => g.id === selectedGap), [gaps, selectedGap]);

    // Track if we've done initial fitView (used inside fetchGraph)
    const hasInitialFit = useRef(false);

    // Fetch graph data from API to get layout
    useEffect(() => {
        const fetchGraph = async () => {
            if (!project?.id) return
            try {
                const res = await fetch(`/api/projects/${project.id}/views`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ viewType: 'gap' })
                });

                if (res.ok) {
                    const data = await res.json();

                    // Transform API nodes to GapNodes
                    const processedNodes = data.nodes.map((node: any) => {
                        // Check if this node is involved in the selected gap's phase
                        let phaseName = undefined;
                        // Use API-provided changeId first, or try to find it in project changes
                        const apiChangeId = node.data.changeId;
                        const changeRecord = project.changes?.find((c: any) => c.componentId === node.id) || (apiChangeId ? { id: apiChangeId, gapId: node.data.gapId, gapPhaseId: node.data.gapPhaseId } : undefined);

                        // In View Mode: Show phase info if derived from selectedGap
                        if (selectionMode === "view" && changeRecord && changeRecord.gapId === selectedGapId) {
                            if (changeRecord.gapPhaseId) {
                                const phase = activeGap?.phases?.find((p: any) => p.id === changeRecord.gapPhaseId)
                                if (phase) phaseName = phase.name
                            }
                        }

                        const status = node.data.changeStatus;
                        const isChanged = status === 'added' || status === 'modified' || status === 'removed';

                        // Selection Logic
                        const idForSelection = apiChangeId || changeRecord?.id || node.id;
                        // Check if already assigned to ANOTHER gap (roadmap)
                        // Note: If we are EDITING a roadmap (selectedGapId is set), we allow selecting its own changes.
                        // If creating new (selectedGapId is empty), any assigned change is locked.
                        const isAssignedToOther = changeRecord?.gapId && changeRecord.gapId !== selectedGapId;

                        return {
                            ...node,
                            type: 'gapNode',
                            data: {
                                ...node.data,
                                changeType: isChanged ? status.toUpperCase() : undefined,
                                phaseName: phaseName,
                                changeId: idForSelection,
                                gapId: changeRecord?.gapId,
                                gapPhaseId: changeRecord?.gapPhaseId,
                                isContext: !isChanged,
                                isAssigned: isAssignedToOther
                            },
                        };
                    });

                    setNodes(processedNodes);

                    // Process Edges to add changeId and styles
                    const processedEdges = data.edges.map((edge: Edge) => {
                        const apiChangeId = edge.data?.changeId;
                        const changeRecord = project.changes?.find((c: any) => c.componentId === edge.id || c.componentId === `REL-${edge.source}-${edge.target}`);
                        const resolvedChangeId = apiChangeId || changeRecord?.id;

                        const idForSelection = resolvedChangeId || edge.id;
                        const isAssignedToOther = changeRecord?.gapId && changeRecord.gapId !== selectedGapId;
                        const isSelected = selectedIds.includes(idForSelection);
                        const isChanged = edge.data?.changeStatus === 'added' || edge.data?.changeStatus === 'removed';

                        return {
                            ...edge,
                            data: {
                                ...edge.data,
                                changeId: resolvedChangeId,
                                changeType: isChanged ? edge.data?.changeStatus : undefined,
                                isAssigned: isAssignedToOther
                            },
                        }
                    });

                    setEdges(processedEdges);

                    // Fit view ONCE on initial load only
                    if (!hasInitialFit.current) {
                        setTimeout(() => {
                            fitView({
                                padding: 0.3,
                                duration: 500,
                                includeHiddenNodes: true
                            });
                            hasInitialFit.current = true;
                        }, 100);
                    }
                }
            } catch (err) {
                console.error("Failed to load gap map", err)
            }
        }

        fetchGraph();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project.id, selectedGapId]);

    // Apply filtering and selection logic
    const visibleNodes = useMemo(() => {
        return nodes.map(node => {
            const isSelected = selectedIds.includes(node.data.changeId as string || node.id);
            const isAssignedToOther = node.data.isAssigned as boolean;
            const isChanged = node.data.changeType;

            return {
                ...node,
                data: {
                    ...node.data,
                    isSelected
                },
                // Style overrides
                style: {
                    ...(node.style || {}),
                    // Improve visibility of context nodes
                    opacity: !isChanged ? 1 : (isAssignedToOther ? 0.5 : 1),
                    cursor: isAssignedToOther ? 'not-allowed' : 'pointer',
                    zIndex: isSelected ? 10 : 0
                }
            };
        });
    }, [nodes, selectedIds]);

    // Apply styles to edges based on selection
    const visibleEdges = useMemo(() => {
        return edges.map(edge => {
            const isSelected = selectedIds.includes(edge.data?.changeId as string || edge.id);
            const isAssignedToOther = edge.data?.isAssigned as boolean;
            const isChanged = edge.data?.changeType;

            return {
                ...edge,
                style: {
                    ...edge.style,
                    stroke: selectionMode === "multi" && isSelected ? "#3b82f6" : (isAssignedToOther ? "#cbd5e1" : edge.style?.stroke),
                    strokeWidth: selectionMode === "multi" && isSelected ? 4 : (edge.style?.strokeWidth || 2),
                    opacity: !isChanged && selectionMode === "multi" ? 0.7 : (isAssignedToOther ? 0.4 : (edge.style?.opacity || 1))
                },
                animated: selectionMode === "multi" && isSelected ? true : edge.animated,
                zIndex: selectionMode === "multi" && isSelected ? 20 : 0
            };
        });
    }, [edges, selectedIds, selectionMode]);

    const toggleSelection = useCallback((changeId: string) => {
        if (!changeId || !onSelectionChange) return;

        // Determine new selection state for the clicked item
        let newSelection = [];
        if (selectedIds.includes(changeId)) {
            newSelection = selectedIds.filter(id => id !== changeId);
        } else {
            newSelection = [...selectedIds, changeId];
        }

        // AUTO-SELECT EDGES: If both endpoints of an edge are selected, select the edge too.
        // 1. Identify all currently selected Node IDs (based on selected Change IDs)
        const selectedNodeIds = new Set<string>();
        nodes.forEach(node => {
            if (node.data.changeId && newSelection.includes(node.data.changeId as string)) {
                selectedNodeIds.add(node.id);
            }
        });

        // 2. Check edges
        const edgesToSelect = new Set<string>();
        edges.forEach(edge => {
            // Only consider edges that represent a change and aren't assigned elsewhere
            if (edge.data?.changeId && !edge.data?.isAssigned) {
                if (selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)) {
                    edgesToSelect.add(edge.data.changeId as string);
                }
            }
        });

        // 3. Merge edge selections
        // We only ADD edges automatically, we don't remove them automatically (to avoid accidental data loss)
        // unless one of the nodes was deselected, in which case the edge MIGHT need deselecting?
        // Actually, simpler user expectation: If I select A and B, A-B is selected.
        // If I deselect A, A-B remains selected? No, probably should deselect.
        // But let's stick to additive only for now to be safe, or just sync fully.

        // Sync approach: Enforce that if A & B are selected, A-B is selected.
        const finalSelection = new Set(newSelection);
        edgesToSelect.forEach(e => finalSelection.add(e));

        onSelectionChange(Array.from(finalSelection));

    }, [selectedIds, onSelectionChange, nodes, edges]);

    const onNodeClick = useCallback((event: any, node: Node) => {
        // Only allow selecting nodes that represent a CHANGE (Add/Modify/Remove)
        // AND are not already assigned to another roadmap
        if (node.data.changeType && !node.data.isAssigned) {

            if (selectionMode === "multi") {
                const changeId = node.data.changeId as string;
                toggleSelection(changeId);
                return;
            }

            // View Mode Default Behavior
            setSelectedNode(node)
            const currentPhaseId = node.data.gapPhaseId as string

            setSelectedGap(selectedGapId || "")
            setSelectedPhase(currentPhaseId || "")
            setIsAssignDialogOpen(true)
        }
    }, [selectedGapId, selectionMode, selectedIds, onSelectionChange, toggleSelection])

    const onEdgeClick = useCallback((event: any, edge: Edge) => {
        if (selectionMode === "multi" && edge.data?.changeId && !edge.data?.isAssigned) {
            toggleSelection(edge.data.changeId as string);
        }
    }, [selectionMode, toggleSelection]);

    const handleSaveAssignment = async () => {
        if (!selectedNode || !selectedGap) return
        const changeId = selectedNode.data.changeId as string
        if (!changeId || !onAssignChange) return

        await onAssignChange([changeId], selectedGap, selectedPhase || undefined)
        setIsAssignDialogOpen(false)
        setSelectedNode(null)
    }

    return (
        <div className="w-full h-full relative bg-slate-50/50">
            <ReactFlow
                nodes={visibleNodes}
                edges={visibleEdges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                minZoom={0.1}
                maxZoom={2}
                nodesDraggable={false}
                panOnDrag={true}
                panOnScroll={true}
                zoomOnScroll={true}
                fitView
            >
                <Background color="#e2e8f0" gap={16} />
                <Controls />
                <MiniMap />

                <Panel position="top-right" className="bg-white/90 p-3 rounded-lg shadow-sm backdrop-blur-sm border flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Legend</span>
                    <div className="text-xs font-medium text-slate-600 flex flex-col gap-1.5">
                        <span className="flex items-center"><div className="w-2 h-2 rounded-full border-2 border-green-500 bg-green-100 mr-2" /> CREATE</span>
                        <span className="flex items-center"><div className="w-2 h-2 rounded-full border-2 border-orange-500 bg-orange-100 mr-2" /> MODIFY</span>
                        <span className="flex items-center"><div className="w-2 h-2 rounded-full border-2 border-red-500 bg-red-100 mr-2" /> REMOVE</span>
                        <span className="flex items-center opacity-50"><div className="w-2 h-2 rounded-full border bg-slate-200 mr-2" /> Context (Unchanged)</span>
                    </div>
                </Panel>

                {selectionMode === "multi" && (
                    <Panel position="top-center" className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg font-medium text-sm animate-in fade-in slide-in-from-top-4">
                        Selection Mode: {selectedIds.length} changes selected
                    </Panel>
                )}
            </ReactFlow>



            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add to Roadmap</DialogTitle>
                        <DialogDescription>
                            Assign <span className="font-semibold text-primary">{selectedNode?.data.label as string}</span> to an implementation phase.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Roadmap Phase</Label>
                            <Select value={selectedPhase} onValueChange={setSelectedPhase} disabled={!selectedGap}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Phase" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeGap?.phases?.map((p: any) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            <span className="font-medium">{p.name}</span>
                                            {p.startDate && <span className="text-muted-foreground ml-2 text-xs" suppressHydrationWarning>({new Date(p.startDate).toLocaleDateString()})</span>}
                                        </SelectItem>
                                    )) || <div className="p-2 text-xs text-muted-foreground">No phases defined. Create phases in the Roadmap tab first.</div>}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveAssignment}>Save Assignment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export function GapVisualMap(props: GapVisualMapProps) {
    return (
        <ReactFlowProvider>
            <GapVisualMapContent {...props} />
        </ReactFlowProvider>
    );
}
