"use client"

import { useState, useEffect } from 'react';
import { X, Plus, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
    LAYER_CARD_TYPES,
    LAYERS,
    BIAN_FUNCTIONAL_PATTERNS,
    BIAN_BUSINESS_AREAS,
    BIAN_ACTION_TERMS
} from '@/lib/taxonomy';

export interface NewComponent {
    id: string;
    name: string;
    type: string;
    description: string;
    layer: string;
    version?: string;
    lifecycle: string;
    validFrom?: string;
    validTo?: string;
    strategicValue: string;
    technicalFit: string;
    complexity: string;
    tags?: string;
    externalLink?: string;
    metadata?: string;

    // BIAN Fields
    bianBusinessArea?: string;
    bianBusinessDomain?: string;
    bianFunctionalPattern?: string;
    bianActionTerm?: string;
    httpMethod?: string;
    path?: string;

    // Integration Fields
    leanIXFactSheetType?: string;
    leanIXExternalId?: string;
}

interface CreateComponentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (component: NewComponent) => void;
}

const LAYER_COLORS: Record<string, { border: string, bg: string, ring: string, text: string }> = {
    Business: { border: 'border-amber-500', bg: 'bg-amber-50', ring: 'ring-amber-200', text: 'text-amber-700' },
    BIAN: { border: 'border-rose-500', bg: 'bg-rose-50', ring: 'ring-rose-200', text: 'text-rose-700' },
    Application: { border: 'border-blue-500', bg: 'bg-blue-50', ring: 'ring-blue-200', text: 'text-blue-700' },
    Data: { border: 'border-emerald-500', bg: 'bg-emerald-50', ring: 'ring-emerald-200', text: 'text-emerald-700' },
    Technology: { border: 'border-violet-500', bg: 'bg-violet-50', ring: 'ring-violet-200', text: 'text-violet-700' }
};

export function CreateComponentModal({ isOpen, onClose, onSave }: CreateComponentModalProps) {
    const [activeTab, setActiveTab] = useState('general');

    const [layer, setLayer] = useState(LAYERS[0]);
    const [type, setType] = useState(LAYER_CARD_TYPES[LAYERS[0]][0]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    // New Fields State
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

    const [error, setError] = useState('');

    // Sync type default when layer changes
    useEffect(() => {
        const validTypes = LAYER_CARD_TYPES[layer] || [];
        if (!validTypes.includes(type)) {
            setType(validTypes[0] || '');
        }
    }, [layer]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Component name is required');
            return;
        }

        const id = `CUSTOM-${type.toUpperCase()}-${Date.now()}`;

        onSave({
            id,
            name: name.trim(),
            type,
            description: description.trim(),
            layer,

            // New Fields
            version: version.trim() || undefined,
            lifecycle,
            validFrom: validFrom || undefined,
            validTo: validTo || undefined,
            strategicValue,
            technicalFit,
            complexity,
            tags: tags.trim() || undefined,
            externalLink: externalLink.trim() || undefined,
            metadata: metadata.trim() || undefined,

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

        // Reset and close
        setLayer(LAYERS[0]);
        setType(LAYER_CARD_TYPES[LAYERS[0]][0]);
        setName('');
        setDescription('');
        setVersion('');
        setLifecycle('Plan');
        setValidFrom('');
        setValidTo('');
        setStrategicValue('Medium');
        setTechnicalFit('Adequate');
        setComplexity('Medium');
        setTags('');
        setExternalLink('');
        setMetadata('');
        setBianBusinessArea('');
        setBianBusinessDomain('');
        setBianFunctionalPattern('');
        setBianActionTerm('');
        setHttpMethod('');
        setPath('');
        setLeanIXFactSheetType('');
        setLeanIXExternalId('');

        setError('');
        setActiveTab('general');
        onClose();
    };

    const showBIANFields = layer === 'BIAN';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 shrink-0">
                    <div className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-green-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Create New Component</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    <form id="create-component-form" onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                                {error}
                            </div>
                        )}

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className={`grid w-full mb-4 ${showBIANFields ? 'grid-cols-5' : 'grid-cols-4'}`}>
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
                                            return (
                                                <button
                                                    key={l}
                                                    type="button"
                                                    onClick={() => setLayer(l)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected
                                                            ? `${colors.bg} ${colors.border} ${colors.text} ring-1 ${colors.ring} shadow-sm border`
                                                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                                        }`}
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
                                            return (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setType(t)}
                                                    className={`p-3 rounded-lg border text-left transition-all ${isSelected
                                                            ? `border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200`
                                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                                        }`}
                                                >
                                                    <div className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                                                        {t.replace(/([A-Z])/g, ' $1').trim()}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Content Management System"
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe the component's purpose and scope..."
                                        rows={3}
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
                                                <SelectTrigger>
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
                                            />
                                        </div>
                                    </div>

                                    {(type === 'ServiceDomain' || type === 'ServiceOperation') && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Functional Pattern</Label>
                                                <Select value={bianFunctionalPattern} onValueChange={setBianFunctionalPattern}>
                                                    <SelectTrigger>
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
                                                        <SelectTrigger>
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
                                                    <SelectTrigger>
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
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
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
                                        <Input
                                            value={version}
                                            onChange={(e) => setVersion(e.target.value)}
                                            placeholder="e.g. 1.0.0"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Valid From</Label>
                                        <Input
                                            type="date"
                                            value={validFrom}
                                            onChange={(e) => setValidFrom(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Valid To</Label>
                                        <Input
                                            type="date"
                                            value={validTo}
                                            onChange={(e) => setValidTo(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* STRATEGIC TAB */}
                            <TabsContent value="strategic" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Strategic Value</Label>
                                    <Select value={strategicValue} onValueChange={setStrategicValue}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Low">Low - Commodity</SelectItem>
                                            <SelectItem value="Medium">Medium - Operational</SelectItem>
                                            <SelectItem value="High">High - Differentiating</SelectItem>
                                            <SelectItem value="Critical">Critical - Core Business</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Technical Fit</Label>
                                    <Select value={technicalFit} onValueChange={setTechnicalFit}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Poor">Poor - Needs Replacement</SelectItem>
                                            <SelectItem value="Adequate">Adequate - Maintainable</SelectItem>
                                            <SelectItem value="Good">Good - Modern Standard</SelectItem>
                                            <SelectItem value="Excellent">Excellent - Leading Edge</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Complexity</Label>
                                    <Select value={complexity} onValueChange={setComplexity}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
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
                                    <Label>Tags (Comma separated)</Label>
                                    <Input
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        placeholder="e.g. cloud, pci-dss, customer-facing"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>LeanIX Fact Sheet Type</Label>
                                        <Input
                                            value={leanIXFactSheetType}
                                            onChange={(e) => setLeanIXFactSheetType(e.target.value)}
                                            placeholder="e.g. BusinessCapability"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>LeanIX External ID</Label>
                                        <Input
                                            value={leanIXExternalId}
                                            onChange={(e) => setLeanIXExternalId(e.target.value)}
                                            placeholder="Ext-12345"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>External Link</Label>
                                    <Input
                                        value={externalLink}
                                        onChange={(e) => setExternalLink(e.target.value)}
                                        placeholder="https://docs.example.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Custom Metadata (JSON)</Label>
                                    <Textarea
                                        value={metadata}
                                        onChange={(e) => setMetadata(e.target.value)}
                                        placeholder='{"costCenter": "123", "owner": "John Doe"}'
                                        className="font-mono text-xs"
                                        rows={3}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
                    <div className="flex items-center text-xs text-gray-500">
                        <Info className="w-3 h-3 mr-1" />
                        <span>Layer: {layer}</span>
                    </div>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" form="create-component-form" className="bg-green-600 hover:bg-green-700 gap-2">
                            <Plus className="w-4 h-4" />
                            Create Component
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
