"use client"

import { useCallback, useEffect, useState } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Panel,
    useReactFlow,
    ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useArchStore } from '@/store/useArchStore';
import { CatalogSelector } from './CatalogSelector';
import { ArchNode } from './ArchNode';

import { TimeTravelSlider, TimeTravelDate } from '../project/TimeTravelSlider';

const nodeTypes = {
    archNode: ArchNode,
};

function MindMapContent() {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, fetchComponents, loadCatalog } = useArchStore();
    const { fitView } = useReactFlow();
    const [currentDate, setCurrentDate] = useState<TimeTravelDate>({
        year: new Date().getFullYear(),
        month: 11 // default to end of year to show all
    });

    // Initial fetch
    useEffect(() => {
        loadCatalog();
    }, [loadCatalog]);

    // Fit view when nodes change
    useEffect(() => {
        if (nodes.length > 0) {
            window.requestAnimationFrame(() => {
                fitView({ padding: 0.2, duration: 400 });
            });
        }
    }, [nodes.length, fitView]);

    // Filter nodes based on Time Travel
    const visibleNodes = nodes.map(node => {
        // Evaluate the end of the currently selected month
        const selectedDate = new Date(currentDate.year, currentDate.month, 31);

        const validFrom = node.data.validFrom ? new Date(node.data.validFrom as string) : new Date('2000-01-01');
        const validTo = node.data.validTo ? new Date(node.data.validTo as string) : new Date('9999-12-31');

        // Check if node is valid in current timeline slice
        const isValidTime = (validFrom <= selectedDate) && (validTo > selectedDate);

        return {
            ...node,
            hidden: !isValidTime
        };
    });

    return (
        <div className="w-full h-full relative bg-white">
            <ReactFlow
                nodes={visibleNodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                minZoom={0.1}
                maxZoom={2}
            >
                <Background />
                <Controls />
                <MiniMap
                    nodeColor={(node) => {
                        const layer = node.data?.layer;
                        switch (layer) {
                            case 'Business': return '#fbbf24';
                            case 'Data': return '#34d399';
                            case 'Application': return '#60a5fa';
                            case 'Technology': return '#a78bfa';
                            default: return '#9ca3af';
                        }
                    }}
                />
                <Panel position="top-left">
                    <CatalogSelector />
                </Panel>

                <Panel position="bottom-center" className="mb-4 w-full flex justify-center pointer-events-none">
                    <div className="pointer-events-auto w-full max-w-2xl px-4">
                        <TimeTravelSlider
                            currentDate={currentDate}
                            onChange={setCurrentDate}
                            minYear={2022}
                            maxYear={2028}
                        />
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
}

export function ArchMindMap() {
    return (
        <ReactFlowProvider>
            <MindMapContent />
        </ReactFlowProvider>
    );
}
