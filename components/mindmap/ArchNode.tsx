"use client"

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Layers, Database, Server, Cog, Cloud, ChevronDown, ChevronUp, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Layer, Status } from '@/store/useArchStore';

const getLayerIcon = (layer: string) => {
    switch (layer) {
        case 'Business': return Cog;
        case 'BIAN': return Network;
        case 'Application': return Layers;
        case 'Data': return Database;
        case 'Technology': return Server;
        default: return Layers;
    }
};

const getLayerColor = (layer: string) => {
    switch (layer) {
        case 'Business': return 'bg-amber-100 border-amber-400 text-amber-900';
        case 'BIAN': return 'bg-rose-100 border-rose-400 text-rose-900';
        case 'Application': return 'bg-blue-100 border-blue-400 text-blue-900';
        case 'Data': return 'bg-emerald-100 border-emerald-400 text-emerald-900';
        case 'Technology': return 'bg-violet-100 border-violet-400 text-violet-900';
        default: return 'bg-gray-100 border-gray-400 text-gray-900';
    }
};

const getStatusBadge = (status: Status) => {
    switch (status) {
        case 'As-Is': return 'bg-gray-200 text-gray-700';
        case 'Target': return 'bg-green-200 text-green-700';
        case 'Transitional': return 'bg-yellow-200 text-yellow-700';
        default: return 'bg-gray-100';
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

const ArchNodeComponent = ({ data }: NodeProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const layer = data.layer as Layer;
    const status = data.status as Status;
    const Icon = getLayerIcon(layer);

    const description = (data.description as string) || (data.notes as string) || '';
    const hasLongDescription = description && description.length > 50;

    // New Data Fields
    const lifecycle = data.lifecycle as string;
    const strategicValue = data.strategicValue as string;
    const version = data.version as string;
    const tags = data.tags as string;
    const externalLink = data.externalLink as string;
    // Additional fields
    const bcL2 = data.bcL2 as string;
    const bcL3 = data.bcL3 as string;
    const aiModality = data.aiModality as string;
    const aiImpact = data.aiImpact as string;
    const notes = data.notes as string;

    // Layer specific fields
    const domainArea = data.domainArea as string;
    const bcL1 = data.bcL1 as string;
    const pattern = data.pattern as string;
    const domain = data.domain as string;

    // BIAN specific fields
    const bianBusinessArea = data.bianBusinessArea as string;
    const bianBusinessDomain = data.bianBusinessDomain as string;
    const bianFunctionalPattern = data.bianFunctionalPattern as string;
    const bianActionTerm = data.bianActionTerm as string;
    const httpMethod = data.httpMethod as string;
    const path = data.path as string;

    // Cast optional fields to ensure type safety in JSX
    const technicalFit = data.technicalFit as string;
    const complexity = data.complexity as string;
    const validFrom = data.validFrom as string;
    const validTo = data.validTo as string;

    const getLifecycleColor = (l: string) => {
        switch (l) {
            case 'Plan': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'Build': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'Run': return 'text-green-600 bg-green-50 border-green-200';
            case 'Retire': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStrategicColor = (s: string) => {
        switch (s) {
            case 'Critical': return 'text-purple-700 bg-purple-50 ring-1 ring-purple-200';
            case 'High': return 'text-indigo-700 bg-indigo-50 ring-1 ring-indigo-200';
            case 'Medium': return 'text-blue-700 bg-blue-50 ring-1 ring-blue-200';
            default: return 'text-slate-600 bg-slate-50 ring-1 ring-slate-200';
        }
    };

    return (
        <div className={cn(
            "w-[260px] shadow-md rounded-lg border-2 overflow-hidden bg-white hover:shadow-xl transition-all",
            getLayerColor(layer).split(' ')[1] // Use border color
        )}>
            <Handle type="target" position={Position.Top} className={cn("w-3 h-3 bg-gray-400", layer === 'Business' && "opacity-0")} />

            <div className={cn("px-3 py-2 flex items-center justify-between border-b", getLayerColor(layer))}>
                <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{layer}</span>
                </div>
                {version && <span className="text-[10px] font-mono bg-white/50 px-1.5 rounded text-gray-800">v{version}</span>}
            </div>

            <div className="p-3 bg-white">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
                        {data.label as string}
                    </div>
                </div>

                {/* Primary Badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                    {lifecycle && (
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", getLifecycleColor(lifecycle))}>
                            {lifecycle}
                        </span>
                    )}
                    {strategicValue && (
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", getStrategicColor(strategicValue))}>
                            {strategicValue}
                        </span>
                    )}
                </div>

                {/* Metadata based on layer type */}
                <div className="space-y-1 mb-2">
                    {!!data.vendor && (
                        <div className="flex items-center gap-2">
                            <Cloud className="w-3 h-3 text-gray-400" />
                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", getVendorBadge(String(data.vendor)))}>
                                {String(data.vendor)}
                            </span>
                        </div>
                    )}

                    {/* AI Capabilities Badge - Highlighting this as it's important */}
                    {(aiModality || aiImpact) && (
                        <div className="flex gap-1 flex-wrap mt-1">
                            {aiModality && <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded border border-purple-200">AI: {aiModality}</span>}
                            {aiImpact && <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded border border-purple-200">Impact: {aiImpact}</span>}
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
                        </div>
                    )}

                    {/* Expanded Details */}
                    {isExpanded && (
                        <div className="mt-3 pt-2 border-t border-gray-100 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                            {/* Business Layer */}
                            {layer === 'Business' && (
                                <div className="space-y-1">
                                    {domainArea && (
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-gray-500">Domain Area:</span>
                                            <span className="font-medium text-gray-700 truncate ml-2">{domainArea}</span>
                                        </div>
                                    )}
                                    {bcL1 && (
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-gray-500">L1 Capability:</span>
                                            <span className="font-medium text-gray-700 truncate ml-2">{bcL1}</span>
                                        </div>
                                    )}
                                    {bcL2 && (
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-gray-500">L2 Capability:</span>
                                            <span className="font-medium text-gray-700 truncate ml-2">{bcL2}</span>
                                        </div>
                                    )}
                                    {bcL3 && (
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-gray-500">L3 Capability:</span>
                                            <span className="font-medium text-gray-700 truncate ml-2">{bcL3}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* BIAN Layer */}
                            {layer === 'BIAN' && (
                                <div className="space-y-1">
                                    {bianBusinessArea && (
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-gray-500">BIAN Area:</span>
                                            <span className="font-medium text-gray-700 truncate ml-2">{bianBusinessArea}</span>
                                        </div>
                                    )}
                                    {bianBusinessDomain && (
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-gray-500">BIAN Domain:</span>
                                            <span className="font-medium text-gray-700 truncate ml-2">{bianBusinessDomain}</span>
                                        </div>
                                    )}
                                    {bianFunctionalPattern && (
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-gray-500">Pattern:</span>
                                            <span className="font-medium text-gray-700 truncate ml-2">{bianFunctionalPattern}</span>
                                        </div>
                                    )}
                                    {bianActionTerm && (
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-gray-500">Action:</span>
                                            <span className="font-medium text-gray-700 truncate ml-2">{bianActionTerm}</span>
                                        </div>
                                    )}
                                    {path && (
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-gray-500">Endpoint:</span>
                                            <span className="font-mono text-gray-700 truncate ml-2">
                                                {httpMethod ? `${httpMethod} ` : ''}{path}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Data Layer */}
                            {layer === 'Data' && pattern && (
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">Pattern:</span>
                                    <span className="font-medium text-gray-700 truncate ml-2">{pattern}</span>
                                </div>
                            )}

                            {/* Application Layer */}
                            {layer === 'Application' && domain && (
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">Domain:</span>
                                    <span className="font-medium text-gray-700 truncate ml-2">{domain}</span>
                                </div>
                            )}

                            {/* Technology Layer / Generic Notes */}
                            {notes && notes !== description && (
                                <div className="pt-1">
                                    <span className="text-[10px] text-gray-500 block mb-0.5">Notes:</span>
                                    <p className="text-[10px] text-gray-700 bg-gray-50 p-1 rounded">{notes}</p>
                                </div>
                            )}

                            {/* Standard Fields */}
                            {technicalFit && (
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">Tech Fit:</span>
                                    <span className="font-medium text-gray-700">{technicalFit}</span>
                                </div>
                            )}
                            {complexity && (
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">Complexity:</span>
                                    <span className="font-medium text-gray-700">{complexity}</span>
                                </div>
                            )}
                            {validFrom && (
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-500">Valid:</span>
                                    <span className="font-medium text-gray-700">
                                        {new Date(validFrom).getFullYear()} -
                                        {validTo ? new Date(validTo).getFullYear() : 'Now'}
                                    </span>
                                </div>
                            )}
                            {tags && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {tags.split(',').map((tag, i) => (
                                        <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded">
                                            #{tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {externalLink && (
                                <a
                                    href={externalLink}
                                    target="_blank"
                                    onMouseDown={(e) => e.stopPropagation()} // Prevent node drag
                                    rel="noreferrer"
                                    className="block mt-1 text-[10px] text-blue-500 hover:underline truncate"
                                >
                                    {externalLink}
                                </a>
                            )}

                            {/* Fallback for empty state */}
                            {!technicalFit && !complexity && !validFrom && !tags && !externalLink &&
                                !domainArea && !bcL1 && !bcL2 && !bcL3 && !pattern && !domain && !notes && (
                                    <div className="text-[10px] text-gray-400 italic text-center py-1">
                                        No additional details available
                                    </div>
                                )}
                        </div>
                    )}

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="w-full mt-2 flex items-center justify-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 py-1 hover:bg-gray-50 rounded transition-colors"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-3 h-3" />
                                <span className="uppercase tracking-wider font-semibold">Less</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3" />
                                <span className="uppercase tracking-wider font-semibold">More</span>
                            </>
                        )}
                    </button>

                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-500 uppercase font-medium">{data.type as string || 'Component'}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", getStatusBadge(status))}>
                        {status}
                    </span>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400" />
        </div>
    );
};

export const ArchNode = memo(ArchNodeComponent);
