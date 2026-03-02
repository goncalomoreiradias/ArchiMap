import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from 'lucide-react';

import {
    LAYER_CARD_TYPES,
    LAYERS,
    BIAN_FUNCTIONAL_PATTERNS,
    BIAN_BUSINESS_AREAS,
    BIAN_ACTION_TERMS
} from '@/lib/taxonomy';

interface EditComponentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    component: any; // Node data
    isCustom: boolean; // If it's a newly created custom component
}

const LAYER_COLORS: Record<string, { border: string, bg: string, ring: string, text: string }> = {
    Business: { border: 'border-amber-500', bg: 'bg-amber-50', ring: 'ring-amber-200', text: 'text-amber-700' },
    BIAN: { border: 'border-rose-500', bg: 'bg-rose-50', ring: 'ring-rose-200', text: 'text-rose-700' },
    Application: { border: 'border-blue-500', bg: 'bg-blue-50', ring: 'ring-blue-200', text: 'text-blue-700' },
    Data: { border: 'border-emerald-500', bg: 'bg-emerald-50', ring: 'ring-emerald-200', text: 'text-emerald-700' },
    Technology: { border: 'border-violet-500', bg: 'bg-violet-50', ring: 'ring-violet-200', text: 'text-violet-700' }
};

export function EditComponentModal({ isOpen, onClose, onSave, component, isCustom }: EditComponentModalProps) {
    const [activeTab, setActiveTab] = useState('general');

    const [layer, setLayer] = useState(LAYERS[0]);
    const [type, setType] = useState(LAYER_CARD_TYPES[LAYERS[0]][0]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    // New Fields
    const [version, setVersion] = useState('');
    const [lifecycle, setLifecycle] = useState('Plan');
    const [validFrom, setValidFrom] = useState('');
    const [validTo, setValidTo] = useState('');
    const [strategicValue, setStrategicValue] = useState('Medium');
    const [technicalFit, setTechnicalFit] = useState('Adequate');
    const [complexity, setComplexity] = useState('Medium');
    const [tags, setTags] = useState('');
    const [externalLink, setExternalLink] = useState('');
    const [metadata, setMetadata] = useState('');

    // BIAN specific fields
    const [bianBusinessArea, setBianBusinessArea] = useState('');
    const [bianBusinessDomain, setBianBusinessDomain] = useState('');
    const [bianFunctionalPattern, setBianFunctionalPattern] = useState('');
    const [bianActionTerm, setBianActionTerm] = useState('');
    const [httpMethod, setHttpMethod] = useState('');
    const [path, setPath] = useState('');

    // LeanIX tracking
    const [leanIXFactSheetType, setLeanIXFactSheetType] = useState('');
    const [leanIXExternalId, setLeanIXExternalId] = useState('');

    useEffect(() => {
        if (component) {
            setName(component.label || component.name || '');

            // Map legacy types to new taxonomy
            let mappedLayer = component.layer || 'Business';
            let typeStr = component.type || 'BusinessCapability';

            // Legacy fallbacks
            if (typeStr.toLowerCase() === 'business capability' || typeStr.toLowerCase() === 'bc') { mappedLayer = 'Business'; typeStr = 'BusinessCapability'; }
            else if (typeStr.toLowerCase() === 'data capability' || typeStr.toLowerCase() === 'dc') { mappedLayer = 'Data'; typeStr = 'DataEntity'; }
            else if (typeStr.toLowerCase() === 'abb') { mappedLayer = 'Application'; typeStr = 'ApplicationComponent'; }
            else if (typeStr.toLowerCase() === 'sbb') { mappedLayer = 'Technology'; typeStr = 'TechComponent'; }

            // Strict enforce bounds
            if (!LAYERS.includes(mappedLayer)) mappedLayer = LAYERS[0];
            const validTypes = LAYER_CARD_TYPES[mappedLayer];
            if (!validTypes.includes(typeStr)) typeStr = validTypes[0];

            setLayer(mappedLayer);
            setType(typeStr);
            setDescription(component.description || '');

            // New fields
            setVersion(component.version || '');
            setLifecycle(component.lifecycle || 'Plan');

            // Handle date conversion if needed
            const formatDate = (d: any) => d ? new Date(d).toISOString().split('T')[0] : '';
            setValidFrom(formatDate(component.validFrom));
            setValidTo(formatDate(component.validTo));

            setStrategicValue(component.strategicValue || 'Medium');
            setTechnicalFit(component.technicalFit || 'Adequate');
            setComplexity(component.complexity || 'Medium');
            setTags(component.tags || '');
            setExternalLink(component.externalLink || '');
            setMetadata(component.metadata || '');

            // Taxonomy Fields
            setBianBusinessArea(component.bianBusinessArea || '');
            setBianBusinessDomain(component.bianBusinessDomain || '');
            setBianFunctionalPattern(component.bianFunctionalPattern || '');
            setBianActionTerm(component.bianActionTerm || '');
            setHttpMethod(component.httpMethod || '');
            setPath(component.path || '');
            setLeanIXFactSheetType(component.leanIXFactSheetType || '');
            setLeanIXExternalId(component.leanIXExternalId || '');
        }
    }, [component, isOpen]);

    // Handle cascading layer changes conditionally if the user edits
    const handleLayerChange = (newLayer: string) => {
        if (!isCustom) return; // Prevent changing layer on non-custom components
        setLayer(newLayer);
        const validTypes = LAYER_CARD_TYPES[newLayer] || [];
        setType(validTypes[0] || '');
    };

    const handleSave = () => {
        onSave({
            ...component,
            name,
            type,
            layer,
            description,
            // New Fields
            version,
            lifecycle,
            validFrom: validFrom || undefined,
            validTo: validTo || undefined,
            strategicValue,
            technicalFit,
            complexity,
            tags,
            externalLink,
            metadata,
            // Taxonomy Fields
            bianBusinessArea: layer === 'BIAN' && bianBusinessArea ? bianBusinessArea : undefined,
            bianBusinessDomain: layer === 'BIAN' && bianBusinessDomain ? bianBusinessDomain.trim() : undefined,
            bianFunctionalPattern: layer === 'BIAN' && bianFunctionalPattern ? bianFunctionalPattern : undefined,
            bianActionTerm: layer === 'BIAN' && bianActionTerm ? bianActionTerm : undefined,
            httpMethod: layer === 'BIAN' && httpMethod ? httpMethod : undefined,
            path: layer === 'BIAN' && path ? path.trim() : undefined,
            leanIXFactSheetType: leanIXFactSheetType.trim() || undefined,
            leanIXExternalId: leanIXExternalId.trim() || undefined,
        });
        onClose();
    };

    const showBIANFields = layer === 'BIAN';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50">
                <DialogHeader className="px-6 py-4 border-b bg-white">
                    <DialogTitle>Edit Component</DialogTitle>
                    <DialogDescription className="text-xs">
                        Modify component attributes. Architectural identity bounds are locked for catalog items.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className={`grid w-full mb-6 ${showBIANFields ? 'grid-cols-5' : 'grid-cols-4'} bg-white border`}>
                            <TabsTrigger value="general">General</TabsTrigger>
                            {showBIANFields && <TabsTrigger value="bian">BIAN Model</TabsTrigger>}
                            <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
                            <TabsTrigger value="strategic">Strategic</TabsTrigger>
                            <TabsTrigger value="metadata">Metadata</TabsTrigger>
                        </TabsList>

                        {/* GENERAL TAB */}
                        <TabsContent value="general" className="space-y-6">
                            {/* Layer Selection */}
                            <div className="space-y-2">
                                <Label>Architecture Layer</Label>
                                <div className="flex flex-wrap gap-2">
                                    {LAYERS.map(l => {
                                        const isSelected = layer === l;
                                        const colors = LAYER_COLORS[l] || LAYER_COLORS['Technology'];

                                        // If disabled and not selected, fade it out to simulate read-only single choice
                                        const isDisabled = !isCustom && !isSelected;
                                        if (isDisabled) return null; // Hide non-selected choices if locked

                                        return (
                                            <button
                                                key={l}
                                                type="button"
                                                onClick={() => handleLayerChange(l)}
                                                disabled={!isCustom}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected
                                                        ? `${colors.bg} ${colors.border} ${colors.text} ring-1 ${colors.ring} shadow-sm border`
                                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                                    } ${!isCustom ? 'opacity-90 cursor-default' : ''}`}
                                            >
                                                {l}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Card Type Selection */}
                            <div className="space-y-2">
                                <Label>Component Type</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {(LAYER_CARD_TYPES[layer] || []).map(t => {
                                        const isSelected = type === t;

                                        // Hide non-selected choices if locked
                                        const isDisabled = !isCustom && !isSelected;
                                        if (isDisabled) return null;

                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setType(t)}
                                                disabled={!isCustom}
                                                className={`p-3 rounded-lg border text-left transition-all ${isSelected
                                                        ? `border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200`
                                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    } ${!isCustom ? 'opacity-90 cursor-default shadow-sm' : ''}`}
                                            >
                                                <div className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                                                    {t.replace(/([A-Z])/g, ' $1').trim()}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Component Name"
                                    disabled={!isCustom}
                                    className="bg-white"
                                />
                                {!isCustom && <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Info size={12} /> Catalog core identity properties are locked.</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description (Notes)</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="h-24 bg-white"
                                />
                            </div>
                        </TabsContent>

                        {/* BIAN MODEL TAB (ONLY VISIBLE IF LAYER === 'BIAN') */}
                        {showBIANFields && (
                            <TabsContent value="bian" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>BIAN Business Area</Label>
                                        <Select value={bianBusinessArea} onValueChange={setBianBusinessArea}>
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="Select Area" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BIAN_BUSINESS_AREAS.map(area => (
                                                    <SelectItem key={area} value={area}>{area}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>BIAN Business Domain</Label>
                                        <Input
                                            value={bianBusinessDomain}
                                            onChange={(e) => setBianBusinessDomain(e.target.value)}
                                            placeholder="e.g. Retail Banking"
                                            className="bg-white"
                                        />
                                    </div>
                                </div>

                                {(type === 'ServiceDomain' || type === 'ServiceOperation') && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Functional Pattern</Label>
                                            <Select value={bianFunctionalPattern} onValueChange={setBianFunctionalPattern}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select Pattern" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BIAN_FUNCTIONAL_PATTERNS.map(pattern => (
                                                        <SelectItem key={pattern} value={pattern}>{pattern}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {type === 'ServiceOperation' && (
                                            <div className="space-y-2">
                                                <Label>Action Term</Label>
                                                <Select value={bianActionTerm} onValueChange={setBianActionTerm}>
                                                    <SelectTrigger className="bg-white">
                                                        <SelectValue placeholder="Select Action" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {BIAN_ACTION_TERMS.map(term => (
                                                            <SelectItem key={term} value={term}>{term}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {type === 'ServiceOperation' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>HTTP Method</Label>
                                            <Select value={httpMethod} onValueChange={setHttpMethod}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="GET / POST..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="GET">GET</SelectItem>
                                                    <SelectItem value="POST">POST</SelectItem>
                                                    <SelectItem value="PUT">PUT</SelectItem>
                                                    <SelectItem value="PATCH">PATCH</SelectItem>
                                                    <SelectItem value="DELETE">DELETE</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>API Path</Label>
                                            <Input
                                                value={path}
                                                onChange={(e) => setPath(e.target.value)}
                                                placeholder="/api/v1/resource"
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        )}

                        {/* LIFECYCLE TAB */}
                        <TabsContent value="lifecycle" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Lifecycle State</Label>
                                    <Select value={lifecycle} onValueChange={setLifecycle}>
                                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Plan">Plan</SelectItem>
                                            <SelectItem value="Build">Build</SelectItem>
                                            <SelectItem value="Run">Run</SelectItem>
                                            <SelectItem value="Retire">Retire</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Version</Label>
                                    <Input value={version} onChange={(e) => setVersion(e.target.value)} className="bg-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Valid From</Label>
                                    <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Valid To</Label>
                                    <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} className="bg-white" />
                                </div>
                            </div>
                        </TabsContent>

                        {/* STRATEGIC TAB */}
                        <TabsContent value="strategic" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Strategic Value</Label>
                                <Select value={strategicValue} onValueChange={setStrategicValue}>
                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Technical Fit</Label>
                                <Select value={technicalFit} onValueChange={setTechnicalFit}>
                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Poor">Poor</SelectItem>
                                        <SelectItem value="Adequate">Adequate</SelectItem>
                                        <SelectItem value="Good">Good</SelectItem>
                                        <SelectItem value="Excellent">Excellent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Complexity</Label>
                                <Select value={complexity} onValueChange={setComplexity}>
                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>

                        {/* METADATA TAB */}
                        <TabsContent value="metadata" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tags</Label>
                                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma separated" className="bg-white" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>LeanIX Fact Sheet Type</Label>
                                    <Input
                                        value={leanIXFactSheetType}
                                        onChange={(e) => setLeanIXFactSheetType(e.target.value)}
                                        placeholder="e.g. BusinessCapability"
                                        className="bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>LeanIX External ID</Label>
                                    <Input
                                        value={leanIXExternalId}
                                        onChange={(e) => setLeanIXExternalId(e.target.value)}
                                        placeholder="Ext-12345"
                                        className="bg-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>External Link</Label>
                                <Input value={externalLink} onChange={(e) => setExternalLink(e.target.value)} className="bg-white" />
                            </div>
                            <div className="space-y-2">
                                <Label>Metadata (JSON)</Label>
                                <Textarea value={metadata} onChange={(e) => setMetadata(e.target.value)} className="font-mono text-xs bg-white" rows={4} />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-white">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
