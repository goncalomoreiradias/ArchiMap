"use client"

import { useCallback, useEffect, useState, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    useReactFlow,
    SelectionMode,
    Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArchNode } from '../mindmap/ArchNode';
import { DeletableEdge } from '../mindmap/DeletableEdge';
import { toPng, toSvg } from 'html-to-image';
import { Trash2, Undo, X, Download, Image as ImageIcon, FileImage, Network, Loader2 } from 'lucide-react';


// Register custom node types
const nodeTypes = {
    archNode: ArchNode,
};

// Register custom edge types
const edgeTypes = {
    deletable: DeletableEdge,
};

interface ProjectMindMapProps {
    projectId: string;
    viewMode: 'as-is' | 'gap' | 'target';
    isEditMode: boolean;
    onNodeClick?: (node: Node) => void;
    onNodeDoubleClick?: (node: Node) => void;
    onNodeDelete?: (nodeId: string, componentType: string) => void;
    onEdgeDelete?: (edgeId: string) => void;
    onEdgeCreate?: (sourceId: string, targetId: string) => void;
    onNodeViewMapping?: (node: Node) => void;
    stagedDeletions?: Set<string>;
    refreshKey?: number;
}

interface ContextMenuState {
    show: boolean;
    x: number;
    y: number;
    node: Node | null;
    selectedCount?: number;
}

export default function ProjectMindMap({
    projectId,
    viewMode,
    isEditMode,
    onNodeClick,
    onNodeDoubleClick,
    onNodeDelete,
    onEdgeDelete,
    onEdgeCreate,
    onNodeViewMapping,
    stagedDeletions = new Set(),
    refreshKey = 0
}: ProjectMindMapProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { fitView } = useReactFlow();
    const currentDate = new Date(new Date().getFullYear(), 11, 31); // End of current year

    // ... (rest of state)

    const onConnect = useCallback((params: any) => {
        if (onEdgeCreate && params.source && params.target) {
            onEdgeCreate(params.source, params.target);
        }
    }, [onEdgeCreate]);

    const handleNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (isEditMode && onNodeDoubleClick) {
            onNodeDoubleClick(node);
        }
    }, [isEditMode, onNodeDoubleClick]);

    // ... (rest of implementation)
    const [loading, setLoading] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({ show: false, x: 0, y: 0, node: null });
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchGraph = useCallback(async () => {
        if (!projectId) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/views`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ viewType: viewMode })
            });

            if (res.ok) {
                const data = await res.json();

                // Adjust node styles based on change status for Gap view
                const processedNodes = data.nodes.map((node: any) => {
                    let style = { ...node.style };

                    // Apply deletion styling - ONLY in Gap or Target views
                    if (viewMode !== 'as-is' && stagedDeletions.has(node.id)) {
                        style = {
                            ...style,
                            opacity: 0.4,
                            filter: 'grayscale(100%)',
                            border: '2px dashed #9ca3af'
                        };
                    }

                    if (viewMode === 'gap') {
                        if (node.data.hasConflict) {
                            style = { ...style, border: '3px dashed #ef4444', padding: '5px', borderRadius: '12px', boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' };
                        } else if (node.data.changeStatus === 'added') {
                            style = { ...style, border: '3px solid #22c55e', padding: '5px', borderRadius: '12px' };
                        } else if (node.data.changeStatus === 'removed') {
                            style = { ...style, border: '3px solid #ef4444', opacity: 0.7 };
                        } else if (node.data.changeStatus === 'modified') {
                            style = { ...style, border: '3px solid #f59e0b', padding: '5px', borderRadius: '12px' };
                        }
                    }

                    return { ...node, style };
                });

                // Process edges to use deletable type in edit mode
                const processedEdges = data.edges.map((edge: any) => {
                    if (isEditMode && viewMode === 'gap') {
                        return {
                            ...edge,
                            type: 'deletable',
                            data: {
                                ...edge.data,
                                isEditMode: true,
                                onDelete: onEdgeDelete,
                            }
                        };
                    }
                    return edge;
                });

                setNodes(processedNodes);
                setEdges(processedEdges);

                setTimeout(() => {
                    fitView({ padding: 0.2, duration: 800 });
                }, 100);
            }
        } catch (error) {
            console.error("Failed to fetch graph:", error);
        } finally {
            setLoading(false);
        }
    }, [projectId, viewMode, fitView, setNodes, setEdges, stagedDeletions, refreshKey, isEditMode, onEdgeDelete]);

    useEffect(() => {
        fetchGraph();
    }, [fetchGraph]);

    // Refetch when entering/exiting edit mode to ensure latest state
    useEffect(() => {
        if (!isEditMode) {
            fetchGraph();
        }
    }, [isEditMode, fetchGraph]);

    const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
        if (!isEditMode) return;

        event.preventDefault(); // Prevent native browser menu

        const bounds = containerRef.current?.getBoundingClientRect();
        if (bounds) {
            // Check selection count
            const selectedNodes = nodes.filter(n => n.selected);
            const isTargetSelected = node.selected;

            // If we right-click a node that isn't selected, it usually becomes the single selection
            // But ReactFlow handles selection on click. For Context Menu, we might want to respect current selection
            // if the target is part of it.

            const effectiveSelectionCount = isTargetSelected ? selectedNodes.length : 1;

            setContextMenu({
                show: true,
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
                node,
                selectedCount: effectiveSelectionCount
            });
        }
    }, [isEditMode, nodes, onNodeViewMapping]);

    const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        onNodeClick?.(node);
    }, [onNodeClick]);

    const handleDeleteNode = useCallback(() => {
        if (!contextMenu.node || !onNodeDelete) return;

        const nodesToDelete = new Set<Node>();

        // If the right-clicked node is part of the selection, delete all selected nodes
        if (contextMenu.node.selected) {
            nodes.filter(n => n.selected).forEach(n => nodesToDelete.add(n));
        } else {
            // Otherwise only delete the target node
            nodesToDelete.add(contextMenu.node);
        }

        nodesToDelete.forEach(node => {
            const componentType = node.data?.type || 'bc';
            let apiType = 'bc';
            const typeStr = String(componentType).toLowerCase();
            if (typeStr.includes('data')) apiType = 'dc';
            else if (typeStr.includes('abb') || typeStr.includes('application')) apiType = 'abb';
            else if (typeStr.includes('sbb') || typeStr.includes('solution') || typeStr.includes('technology')) apiType = 'sbb';

            // Allow Undo (unstage) or Stage for removal
            if (stagedDeletions.has(node.id)) {
                // Logic handled in parent: if distinct call needed for undo, parent should handle "toggle" or we assume 
                // the delete action toggles it? 
                // Currently page.tsx handleNodeDelete toggles REMOVE change. 
                // So calling it again is fine.
                onNodeDelete(node.id, apiType);
            } else {
                onNodeDelete(node.id, apiType);
            }
        });

        // Also delete connected edges for all deleted nodes
        if (onEdgeDelete) {
            const nodeIds = new Set(Array.from(nodesToDelete).map(n => n.id));
            const connectedEdges = edges.filter(
                e => nodeIds.has(e.source) || nodeIds.has(e.target)
            );
            connectedEdges.forEach(edge => onEdgeDelete(edge.id));
        }

        setContextMenu({ show: false, x: 0, y: 0, node: null });
    }, [contextMenu.node, onNodeDelete, onEdgeDelete, edges, nodes, stagedDeletions]);

    const closeContextMenu = useCallback(() => {
        setContextMenu({ show: false, x: 0, y: 0, node: null });
    }, []);

    const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

    const downloadImage = useCallback((format: 'png' | 'svg') => {
        if (!containerRef.current) return;

        // Use the viewport element which contains the flow
        const flowElement = containerRef.current.querySelector('.react-flow__viewport') as HTMLElement;

        if (!flowElement) return;

        const filter = (node: HTMLElement) => {
            const exclusionClasses = ['react-flow__minimap', 'react-flow__controls', 'react-flow__panel'];
            return !exclusionClasses.some((classname) => node.classList?.contains(classname));
        };

        if (format === 'png') {
            toPng(containerRef.current, { backgroundColor: '#f8fafc', filter, pixelRatio: 2 })
                .then((dataUrl) => {
                    const a = document.createElement('a');
                    a.setAttribute('download', `architecture-view-${viewMode}.png`);
                    a.setAttribute('href', dataUrl);
                    a.click();
                });
        } else {
            toSvg(containerRef.current, { backgroundColor: '#f8fafc', filter })
                .then((dataUrl) => {
                    const a = document.createElement('a');
                    a.setAttribute('download', `architecture-view-${viewMode}.svg`);
                    a.setAttribute('href', dataUrl);
                    a.click();
                });
        }
        setDownloadMenuOpen(false);
    }, [viewMode]);

    // Close context menu on outside click
    useEffect(() => {
        const handleClick = () => closeContextMenu();
        if (contextMenu.show) {
            document.addEventListener('click', handleClick);
        }
        return () => document.removeEventListener('click', handleClick);
    }, [contextMenu.show, closeContextMenu]);

    // Filter nodes based on Time Travel
    const visibleNodes = nodes.map(node => {
        const validFrom = node.data.validFrom ? new Date(node.data.validFrom as string) : new Date('2000-01-01');
        const validTo = node.data.validTo ? new Date(node.data.validTo as string) : new Date('9999-12-31');

        // Check if node is valid in current time context
        const isValidTime = (validFrom <= currentDate) && (validTo > currentDate);

        return {
            ...node,
            hidden: !isValidTime
        };
    });

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative bg-slate-50 overflow-hidden"
            onContextMenu={(e) => {
                // Prevent browser default context menu only when in edit mode
                if (isEditMode) {
                    e.preventDefault();
                }
            }}
        >
            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-50/70 backdrop-blur-[2px] transition-all">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        <div className="bg-white px-4 py-2 rounded-full shadow-md border border-gray-100 font-medium text-sm text-gray-700 animate-pulse">
                            Loading View...
                        </div>
                    </div>
                </div>
            )}

            <ReactFlow
                nodes={visibleNodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                onNodeContextMenu={handleNodeContextMenu}
                defaultEdgeOptions={{
                    type: 'deletable',
                    animated: true,
                    style: { stroke: '#94a3b8', strokeWidth: 2 }
                }}
                minZoom={0.05}
                maxZoom={2.5}
                deleteKeyCode={['Backspace', 'Delete']}
            >
                <Background color="#94a3b8" gap={16} size={1} />
                <Controls />
                <div className="react-flow__panel top right p-2 flex gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                            className="bg-white p-2 rounded-md shadow-md border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-medium text-sm"
                            title="Export View"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>

                        {downloadMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                                <button
                                    onClick={() => downloadImage('png')}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 text-sm"
                                >
                                    <ImageIcon className="w-4 h-4 text-blue-500" />
                                    <div>
                                        <div className="font-medium">Download PNG</div>
                                        <div className="text-xs text-gray-500">High Resolution Image</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => downloadImage('svg')}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 text-sm border-t border-gray-100"
                                >
                                    <FileImage className="w-4 h-4 text-orange-500" />
                                    <div>
                                        <div className="font-medium">Download SVG</div>
                                        <div className="text-xs text-gray-500">Scalable Vector Graphic</div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <MiniMap
                    nodeColor={(node) => {
                        const layer = node.data?.layer as string;
                        if (stagedDeletions.has(node.id)) return '#9ca3af';
                        if (node.data?.changeStatus === 'added') return '#22c55e';
                        if (node.data?.changeStatus === 'removed') return '#ef4444';

                        switch (layer) {
                            case 'Business': return '#fbbf24';
                            case 'Data': return '#34d399';
                            case 'Application': return '#60a5fa';
                            case 'Technology': return '#a78bfa';
                            default: return '#cbd5e1';
                        }
                    }}
                    maskColor="rgba(241, 245, 249, 0.7)"
                />
            </ReactFlow>

            {/* Context Menu */}
            {
                contextMenu.show && contextMenu.node && (
                    <div
                        className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden min-w-[160px]"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                            <div className="text-xs font-semibold text-gray-600 truncate max-w-[200px]">
                                {String(contextMenu.node.data?.label || contextMenu.node.id)}
                            </div>
                        </div>
                        {(contextMenu.node.data?.layer === 'BIAN' || String(contextMenu.node.data?.type).toUpperCase() === 'SERVICEDOMAIN') && (
                            <button
                                onClick={() => {
                                    if (onNodeViewMapping && contextMenu.node) {
                                        onNodeViewMapping(contextMenu.node);
                                        closeContextMenu();
                                    }
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 border-b border-gray-100"
                            >
                                <Network className="w-4 h-4" />
                                View Mapping Delta
                            </button>
                        )}
                        {!stagedDeletions.has(contextMenu.node.id) ? (
                            <button
                                onClick={handleDeleteNode}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {contextMenu.selectedCount && contextMenu.selectedCount > 1
                                    ? `Stage ${contextMenu.selectedCount} for Removal`
                                    : 'Stage for Removal'}
                            </button>
                        ) : (
                            <button
                                onClick={handleDeleteNode}
                                className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                            >
                                <Undo className="w-4 h-4" />
                                Undo Removal
                            </button>
                        )}
                        <button
                            onClick={closeContextMenu}
                            className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                    </div>
                )
            }

            {
                viewMode === 'gap' && (
                    <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-10 w-48">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Legend</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-xs text-gray-700">New / Added</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <span className="text-xs text-gray-700">Modified</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-xs text-gray-700">Removed / Retired</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full border-2 border-red-500 border-dashed"></div>
                                <span className="text-xs text-gray-700 font-medium text-red-600">Conflict / Collision</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                <span className="text-xs text-gray-700">Unchanged</span>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                nodes.length === 0 && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center text-gray-400">
                            <p className="text-lg font-medium">No components in this view</p>
                            <p className="text-sm">Search and add components using the panel below</p>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
