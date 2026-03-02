"use client"

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useArchStore } from '@/store/useArchStore';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProjectEditPanelProps {
    projectId: string;
    onChange: () => void;
}

interface Change {
    id: string;
    changeType: 'ADD' | 'REMOVE';
    componentId: string;
    componentType: string; // 'bc', 'dc', 'abb', 'sbb'
    description: string;
    createdAt: string;
}

export default function ProjectEditPanel({ projectId, onChange }: ProjectEditPanelProps) {
    const { catalogData, loadCatalog } = useArchStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [changes, setChanges] = useState<Change[]>([]);

    useEffect(() => {
        loadCatalog();
        fetchChanges();
    }, [loadCatalog]);

    const fetchChanges = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}/changes`);
            if (res.ok) {
                const data = await res.json();
                setChanges(data);
            }
        } catch (error) {
            console.error("Failed to fetch changes:", error);
        }
    };

    const handleAddChange = async (component: any, type: string) => {
        try {
            const res = await fetch(`/api/projects/${projectId}/changes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    changeType: 'ADD',
                    componentId: component.id,
                    componentType: type,
                    description: `Added ${component.name}`
                })
            });

            if (res.ok) {
                fetchChanges();
                onChange(); // Trigger refresh on parent
            }
        } catch (error) {
            console.error("Failed to add change:", error);
        }
    };

    const handleRemoveChange = async (changeId: string) => {
        try {
            const res = await fetch(`/api/projects/${projectId}/changes?changeId=${changeId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchChanges();
                onChange();
            }
        } catch (error) {
            console.error("Failed to delete change:", error);
        }
    };

    const getComponentName = (id: string, type: string) => {
        if (!catalogData) return id;

        let list: any[] = [];
        if (type === 'bc') list = catalogData.businessCapabilities;
        else if (type === 'dc') list = catalogData.dataCapabilities;
        else if (type === 'abb') list = catalogData.abbs;
        else if (type === 'sbb') list = catalogData.sbbs;

        const found = list.find(item => item.id === id);
        return found ? found.name : id;
    };

    // Filter catalog for searching
    const filteredComponents = catalogData ? [
        ...catalogData.businessCapabilities.map(c => ({ ...c, type: 'bc', label: 'BC' })),
        /* For now we only allow adding BCs directly to project to simplify the graph generation logic, 
           as the graph is built from BCs downwards. 
           Can extend to other types if needed, but the current graph logic relies on BCs as roots.
        */
    ].filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900">Edit Architecture</h3>
                <p className="text-xs text-gray-500 mt-1">Add components to Target state</p>
            </div>

            {/* Change List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Changes</h4>

                    {changes.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No changes pending.</p>
                    ) : (
                        changes.map(change => (
                            <div key={change.id} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm relative group">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${change.changeType === 'ADD' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {change.changeType === 'ADD' ? <Plus className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">
                                        {change.changeType === 'ADD' ? 'Add' : 'Remove'} {getComponentName(change.componentId, change.componentType)}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">Type: {change.componentType.toUpperCase()}</p>
                                </div>
                                <button
                                    onClick={() => handleRemoveChange(change.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add Component Search */}
            <div className="p-4 border-t border-gray-200 bg-white shadow-up">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Add Component</h4>
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search Business Capabilities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {searchTerm && (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                        {filteredComponents.length > 0 ? (
                            filteredComponents.map(comp => (
                                <button
                                    key={comp.id}
                                    onClick={() => {
                                        handleAddChange(comp, comp.type);
                                        setSearchTerm('');
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between group transition-colors"
                                >
                                    <span className="text-sm text-gray-700 truncate">{comp.name}</span>
                                    <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-blue-600" />
                                </button>
                            ))
                        ) : (
                            <div className="p-3 text-center text-sm text-gray-400">No results found</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
