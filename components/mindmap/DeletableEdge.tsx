"use client"

import { memo, useState } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { Trash2 } from 'lucide-react';

interface DeletableEdgeProps extends EdgeProps {
    data?: {
        onDelete?: (edgeId: string) => void;
        isEditMode?: boolean;
    };
}

const DeletableEdge = memo(({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}: DeletableEdgeProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (data?.onDelete) {
            data.onDelete(id);
        }
    };

    return (
        <>
            {/* Invisible wider path for easier hovering */}
            <path
                d={edgePath}
                fill="none"
                strokeWidth={20}
                stroke="transparent"
                className="react-flow__edge-interaction"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            />
            {/* Visible edge path */}
            <path
                id={id}
                style={{
                    ...style,
                    strokeWidth: isHovered ? 3 : 2,
                    stroke: isHovered ? '#f97316' : (style.stroke || '#94a3b8'),
                    transition: 'stroke 0.2s, stroke-width 0.2s',
                }}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            />
            {/* Delete button on hover */}
            {data?.isEditMode && isHovered && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <button
                            onClick={handleDelete}
                            className="flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-all transform hover:scale-110"
                            title="Eliminar conexão"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
});

DeletableEdge.displayName = 'DeletableEdge';

export { DeletableEdge };
