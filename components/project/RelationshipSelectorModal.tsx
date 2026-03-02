"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface Component {
    id: string;
    name: string;
    type: string;
}

interface RelationshipSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedComponents: Component[], relationships: any[]) => void;
    mainComponent: Component | null;
    catalogData: any;
}

export function RelationshipSelectorModal({
    isOpen,
    onClose,
    onConfirm,
    mainComponent,
    catalogData
}: RelationshipSelectorModalProps) {
    const [relatedComponents, setRelatedComponents] = useState<{ component: Component, relationship: any, selected: boolean }[]>([])

    useEffect(() => {
        if (!isOpen || !mainComponent || !catalogData) {
            setRelatedComponents([]);
            return;
        }

        const relationships = catalogData.relationships || [];
        const foundComponents: { component: Component, relationship: any, selected: boolean }[] = [];

        relationships.forEach((rel: any) => {
            // Check if mainComponent is in this relationship chain
            const bcId = rel.businessCapabilityId;
            const dcId = rel.dataCapabilityId;
            const abbId = rel.abbId;
            const sbbId = rel.sbbId;

            const ids = [bcId, dcId, abbId, sbbId].filter(Boolean);

            if (ids.includes(mainComponent.id)) {
                // For EACH DIFFERENT component in this relationship, add it if not main
                if (bcId && bcId !== mainComponent.id) {
                    const comp = catalogData.businessCapabilities.find((c: any) => c.id === bcId);
                    if (comp) foundComponents.push({ component: { id: comp.id, name: comp.name, type: 'bc' }, relationship: rel, selected: true });
                }
                if (dcId && dcId !== mainComponent.id) {
                    const comp = catalogData.dataCapabilities.find((c: any) => c.id === dcId);
                    if (comp) foundComponents.push({ component: { id: comp.id, name: comp.name, type: 'dc' }, relationship: rel, selected: true });
                }
                if (abbId && abbId !== mainComponent.id) {
                    const comp = catalogData.abbs.find((c: any) => c.id === abbId);
                    if (comp) foundComponents.push({ component: { id: comp.id, name: comp.name, type: 'abb' }, relationship: rel, selected: true });
                }
                if (sbbId && sbbId !== mainComponent.id) {
                    const comp = catalogData.sbbs.find((c: any) => c.id === sbbId);
                    if (comp) foundComponents.push({ component: { id: comp.id, name: comp.name, type: 'sbb' }, relationship: rel, selected: true });
                }
            }
        });

        // Remove duplicates (same component might appear in multiple relationships)
        const unique = foundComponents.filter((v, i, a) => a.findIndex(t => t.component.id === v.component.id) === i);

        setRelatedComponents(unique);

    }, [isOpen, mainComponent, catalogData]);

    const handleToggle = (id: string, checked: boolean) => {
        setRelatedComponents(prev => prev.map(item =>
            item.component.id === id ? { ...item, selected: checked } : item
        ));
    };

    const handleConfirm = () => {
        const selectedInfo = relatedComponents.filter(c => c.selected);
        const components = selectedInfo.map(c => c.component);
        const rels = selectedInfo.map(c => c.relationship);
        onConfirm(components, rels);
        onClose();
    };

    if (!mainComponent) return null;

    const getTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'bc': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'dc': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'abb': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'sbb': return 'bg-violet-100 text-violet-800 border-violet-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Related Components</DialogTitle>
                    <DialogDescription>
                        Select which related components you want to add along with <strong>{mainComponent.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 py-4">
                    {relatedComponents.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            No related components found in catalog.
                        </div>
                    ) : (
                        <div className="flex items-center justify-between mb-4">
                            <Label className="text-sm text-gray-500">
                                Found {relatedComponents.length} connections
                            </Label>
                            <div className="space-x-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => setRelatedComponents(prev => prev.map(c => ({ ...c, selected: true })))}
                                >
                                    Select All
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => setRelatedComponents(prev => prev.map(c => ({ ...c, selected: false })))}
                                >
                                    Deselect All
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="h-[300px] border rounded-md overflow-y-auto p-4">
                        <div className="space-y-3">
                            {relatedComponents.map(({ component, selected }) => (
                                <div
                                    key={component.id}
                                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${selected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        id={component.id}
                                        checked={selected}
                                        onChange={(e) => handleToggle(component.id, e.target.checked)}
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor={component.id}
                                                className="text-sm font-medium cursor-pointer"
                                            >
                                                {component.name}
                                            </Label>
                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getTypeColor(component.type)}`}>
                                                {component.type.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-500">{component.id}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleConfirm}>
                        Import {relatedComponents.filter(c => c.selected).length + 1} Components
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
