import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Box, Server, Database, Activity, Network } from 'lucide-react';
import { ArchComponent } from '@/store/useArchStore';

interface ServiceDomainMappingModalProps {
    isOpen: boolean;
    onClose: () => void;
    component: ArchComponent | null;
    projectId: string;
}

interface MappingDelta {
    id: string;
    name: string;
    layer: string;
}

export function ServiceDomainMappingModal({ isOpen, onClose, component, projectId }: ServiceDomainMappingModalProps) {
    const [loading, setLoading] = useState(false);
    const [mapping, setMapping] = useState<{
        asIs: MappingDelta[],
        target: MappingDelta[],
        delta: {
            added: MappingDelta[],
            removed: MappingDelta[],
            unchanged: MappingDelta[]
        }
    } | null>(null);

    useEffect(() => {
        if (isOpen && component && projectId) {
            setLoading(true);
            fetch(`/api/projects/${projectId}/mapping/${component.id}`)
                .then(res => res.json())
                .then(data => {
                    setMapping(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Failed to fetch mapping', err);
                    setLoading(false);
                });
        }
    }, [isOpen, component, projectId]);

    if (!component) return null;

    const getLayerIcon = (layer: string) => {
        switch (layer) {
            case 'Business': return <Activity className="w-4 h-4" />;
            case 'BIAN': return <Network className="w-4 h-4" />;
            case 'Application': return <Box className="w-4 h-4" />;
            case 'Data': return <Database className="w-4 h-4" />;
            case 'Technology': return <Server className="w-4 h-4" />;
            default: return <Box className="w-4 h-4" />;
        }
    };

    const getTypeColor = (layer: string) => {
        switch (layer) {
            case 'Business': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'BIAN': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'Application': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Data': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Technology': return 'bg-violet-100 text-violet-800 border-violet-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="mb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                            <Network className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl flex items-center gap-2">
                                {component.name}
                                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                                    {component.type || 'Service Domain'}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                Component Mapping & Gap Analysis
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        {/* AS-IS Column */}
                        <div className="flex flex-col gap-3">
                            <div className="font-semibold text-slate-700 border-b pb-2 flex justify-between items-center">
                                <span>AS-IS Dependencies</span>
                                <Badge variant="secondary">{mapping?.asIs.length || 0}</Badge>
                            </div>

                            <div className="space-y-2">
                                {mapping?.asIs.length === 0 && (
                                    <div className="text-sm text-slate-500 italic p-3 text-center border border-dashed rounded-lg">No AS-IS mappings</div>
                                )}
                                {mapping?.asIs.map(item => {
                                    const isRemoved = mapping.delta.removed.some(r => r.id === item.id);
                                    return (
                                        <div key={item.id} className={`p-3 rounded-lg border text-sm flex items-center gap-3 transition-colors ${isRemoved ? 'bg-red-50 border-red-200 opacity-75' : 'bg-white border-slate-200 shadow-sm'
                                            }`}>
                                            <div className={`p-1.5 rounded-md ${getTypeColor(item.layer)}`}>
                                                {getLayerIcon(item.layer)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-medium truncate ${isRemoved ? 'line-through text-red-700' : 'text-slate-700'}`}>
                                                    {item.name}
                                                </div>
                                                <div className="text-xs text-slate-500 flex justify-between mt-0.5">
                                                    <span>{item.layer}</span>
                                                    {isRemoved && <span className="font-semibold text-red-600">Removing</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* TARGET Column */}
                        <div className="flex flex-col gap-3">
                            <div className="font-semibold justify-between text-slate-700 border-b pb-2 flex items-center gap-2">
                                <span>TARGET Dependencies</span>
                                <div className="flex gap-2 text-xs">
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">+{mapping?.delta.added.length || 0}</Badge>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {mapping?.target.length === 0 && (
                                    <div className="text-sm text-slate-500 italic p-3 text-center border border-dashed rounded-lg">No TARGET mappings</div>
                                )}
                                {mapping?.target.map(item => {
                                    const isAdded = mapping.delta.added.some(a => a.id === item.id);
                                    return (
                                        <div key={item.id} className={`p-3 rounded-lg border text-sm flex items-center gap-3 transition-colors shadow-sm ${isAdded ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
                                            }`}>
                                            <div className={`p-1.5 rounded-md ${getTypeColor(item.layer)}`}>
                                                {getLayerIcon(item.layer)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-medium truncate ${isAdded ? 'text-green-800' : 'text-slate-700'}`}>
                                                    {item.name}
                                                </div>
                                                <div className="text-xs text-slate-500 flex justify-between mt-0.5">
                                                    <span>{item.layer}</span>
                                                    {isAdded && <span className="font-semibold text-green-600">Adding</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
