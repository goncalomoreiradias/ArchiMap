"use client"

import { useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArchNode } from '@/components/mindmap/ArchNode';

const nodeTypes = {
    archNode: ArchNode,
};

interface ImportPreviewMapProps {
    nodes: Node[];
    edges: Edge[];
}

function PreviewMapContent({ nodes, edges }: ImportPreviewMapProps) {
    // We use local state but initialize with props. 
    // Since props might change (optimization), we can just pass them directly if read-only.
    // However, ReactFlow expects onNodesChange if we want interaction (dragging).
    // For preview, dragging is fine but we don't need to persist it.

    const [localNodes, setLocalNodes, onNodesChange] = useNodesState(nodes);
    const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState(edges);

    return (
        <div className="w-full h-full bg-slate-50 relative border rounded-lg overflow-hidden">
            <div className="absolute top-4 left-4 z-10 bg-white/90 p-2 rounded shadow text-xs font-mono">
                Preview Mode
            </div>

            <ReactFlow
                nodes={localNodes}
                edges={localEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.1}
            >
                <Background color="#94a3b8" gap={16} size={1} />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
}

export function ImportPreviewMap(props: ImportPreviewMapProps) {
    return (
        <ReactFlowProvider>
            <PreviewMapContent {...props} />
        </ReactFlowProvider>
    );
}
