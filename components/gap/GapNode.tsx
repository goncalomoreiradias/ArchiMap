
"use client"

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Layers, Database, Server, Cog, Cloud, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

// Duplicate types/logic from ArchNode for independence but visual parity
type Layer = 'Business' | 'Application' | 'Data' | 'Technology';

const getLayerIcon = (layer: Layer) => {
    switch (layer) {
        case 'Business': return Cog;
        case 'Application': return Layers;
        case 'Data': return Database;
        case 'Technology': return Server;
        default: return Layers;
    }
};

const getLayerColor = (layer: Layer) => {
    switch (layer) {
        case 'Business': return 'bg-amber-100 border-amber-400 text-amber-900';
        case 'Application': return 'bg-blue-100 border-blue-400 text-blue-900';
        case 'Data': return 'bg-emerald-100 border-emerald-400 text-emerald-900';
        case 'Technology': return 'bg-violet-100 border-violet-400 text-violet-900';
        default: return 'bg-gray-100 border-gray-400 text-gray-900';
    }
};

const getVendorBadge = (vendor: string) => {
    switch (vendor) {
        case 'GCP': return 'bg-blue-500 text-white';
        case 'Azure': return 'bg-sky-500 text-white';
        case 'Other': return 'bg-gray-500 text-white';
        default: return 'bg-gray-400 text-white';
    }
};

const GapNodeComponent = ({ data }: NodeProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const layer = (data.layer as Layer) || 'Application';
    const Icon = getLayerIcon(layer);
    const changeType = data.changeType as string | undefined;
    const phaseName = data.phaseName as string | undefined;

    // ArchNode metadata
    const description = (data.description as string) || (data.notes as string) || '';
    const hasLongDescription = description && description.length > 50;

    return (
        <div className={cn(
            "w-[240px] shadow-md rounded-lg border-2 overflow-hidden bg-white hover:shadow-xl transition-shadow",
            getLayerColor(layer).split(' ')[1], // Use border color from layer
            // Overlay change status ring if present, but keep base styling
            changeType === 'ADD' ? 'ring-2 ring-green-400 ring-offset-2' :
                changeType === 'REMOVE' ? 'ring-2 ring-red-400 ring-offset-2 opacity-80' :
                    changeType === 'MODIFY' ? 'ring-2 ring-orange-400 ring-offset-2' : '',
            // Selection highlight (overrides other rings if needed, or adds to them)
            data.isSelected && "ring-4 ring-blue-500 ring-offset-2 z-10"
        )}>
            <Handle type="target" position={Position.Top} className={cn("w-3 h-3 bg-gray-400", layer === 'Business' && "opacity-0")} />

            <div className={cn("px-3 py-2 flex items-center justify-between border-b", getLayerColor(layer))}>
                <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{layer}</span>
                </div>
                {changeType && (
                    <Badge variant="outline" className={cn(
                        "text-[10px] px-1.5 py-0 h-5 border-0 font-bold",
                        changeType === 'ADD' ? "bg-green-600 text-white" :
                            changeType === 'REMOVE' ? "bg-red-600 text-white" :
                                "bg-orange-600 text-white"
                    )}>
                        {changeType}
                    </Badge>
                )}
            </div>

            <div className="p-3 bg-white">
                <div className="text-sm font-semibold mb-2 text-gray-800 leading-snug">
                    {data.label as string}
                </div>

                {/* Metadata based on layer type (Copied from ArchNode) */}
                <div className="space-y-1 mb-2">
                    {!!data.vendor && (
                        <div className="flex items-center gap-2">
                            <Cloud className="w-3 h-3 text-gray-400" />
                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", getVendorBadge(String(data.vendor)))}>
                                {String(data.vendor)}
                            </span>
                        </div>
                    )}

                    {/* Description with expand/collapse */}
                    {description && (
                        <div className="mt-2">
                            <div className={cn(
                                "text-[10px] text-gray-500 italic",
                                !isExpanded && hasLongDescription && "line-clamp-2"
                            )}>
                                {description}
                            </div>
                            {hasLongDescription && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsExpanded(!isExpanded);
                                    }}
                                    className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800"
                                >
                                    {isExpanded ? (
                                        <>
                                            <ChevronUp className="w-3 h-3" />
                                            Show less
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-3 h-3" />
                                            Show more
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-500 uppercase font-medium">{data.type as string || 'Component'}</span>

                    {phaseName ? (
                        <div className="flex items-center px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded text-blue-700 text-[10px] font-bold">
                            <Calendar className="w-3 h-3 mr-1" />
                            {phaseName}
                        </div>
                    ) : (
                        changeType && <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                    )}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400" />
        </div>
    );
};

export const GapNode = memo(GapNodeComponent);
