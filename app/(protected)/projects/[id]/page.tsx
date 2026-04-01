"use client"

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, RotateCw, Plus, Search, X, FileEdit, Edit2, Save, XCircle, Info, Filter, Layers, History, AlertCircle } from 'lucide-react';
import { useArchStore } from '@/store/useArchStore';
import { ReactFlowProvider } from '@xyflow/react';
import ProjectMindMap from '@/components/project/ProjectMindMap';
import { ProjectDetailsModal } from '@/components/project/ProjectDetailsModal';
import { CreateComponentModal, NewComponent } from '@/components/project/CreateComponentModal';
import { EditComponentModal } from '@/components/project/EditComponentModal';
import { VersionHistoryModal } from '@/components/project/VersionHistoryModal';
import { RelationshipSelectorModal } from '@/components/project/RelationshipSelectorModal';
import { ServiceDomainMappingModal } from '@/components/project/ServiceDomainMappingModal';
import { useUser } from '@/contexts/UserContext';

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    currentState: string;
    startDate?: string;
    endDate?: string;
    stakeholders?: string[];
    tags?: string[];
}

interface Change {
    id: string;
    operation: 'ADD' | 'MODIFY' | 'REMOVE' | 'ADD_RELATION';
    componentId: string;
    componentType: string;
    description: string;
}

type LayerFilter = 'all' | 'bc' | 'dc' | 'abb' | 'sbb';

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [project, setProject] = useState<Project | null>(null);
    const [viewMode, setViewMode] = useState<'as-is' | 'gap' | 'target'>('gap');
    const [loading, setLoading] = useState(true);
    const [changes, setChanges] = useState<Change[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingNode, setEditingNode] = useState<any>(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [layerFilters, setLayerFilters] = useState<Set<string>>(new Set());

    const [showRelationshipModal, setShowRelationshipModal] = useState(false);
    const [pendingAddComponent, setPendingAddComponent] = useState<any>(null);

    const [showSDMappingModal, setShowSDMappingModal] = useState(false);
    const [sdMappingNode, setSDMappingNode] = useState<any>(null);

    // Adopt modal state
    const [showAdoptModal, setShowAdoptModal] = useState(false);
    const [adoptState, setAdoptState] = useState<'confirm' | 'loading' | 'success' | 'error'>('confirm');
    const [adoptMessage, setAdoptMessage] = useState('');
    const [adoptCount, setAdoptCount] = useState(0);
    // Submit for approval state
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);
    const { role } = useUser();

    const { catalogData, loadCatalog } = useArchStore();
    const projectId = params.id as string;

    // Check if opened in edit mode from creation
    const isNewProject = searchParams.get('edit') === 'true';

    // Calculate staged deletions from changes
    const stagedDeletions = useMemo(() => {
        return new Set(
            changes.filter(c => c.operation === 'REMOVE').map(c => c.componentId)
        );
    }, [changes]);

    // Calculate staged additions from changes
    const stagedAdditions = useMemo(() => {
        return new Set(
            changes.filter(c => c.operation === 'ADD').map(c => c.componentId)
        );
    }, [changes]);

    const fetchProject = useCallback(async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}`);
            if (res.ok) {
                const data = await res.json();
                setProject(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    const fetchChanges = useCallback(async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}/changes`);
            if (res.ok) {
                const data = await res.json();
                setChanges(data);
            }
        } catch (error) {
            console.error(error);
        }
    }, [projectId]);

    useEffect(() => {
        if (projectId) {
            fetchProject();
            fetchChanges();
            loadCatalog();
        }
    }, [projectId, fetchProject, fetchChanges, loadCatalog]);

    // Auto-enable edit mode for new projects
    useEffect(() => {
        if (isNewProject) {
            setIsEditMode(true);
        }
    }, [isNewProject]);

    // Search catalog - filter by layer
    useEffect(() => {
        if (!catalogData) {
            setSearchResults([]);
            return;
        }

        if (!searchTerm.trim() && layerFilters.size === 0) {
            setSearchResults([]);
            return;
        }

        const term = searchTerm.toLowerCase();
        let results: any[] = [];

        if (layerFilters.size === 0 || layerFilters.has('Business')) {
            results.push(...catalogData.businessCapabilities.filter(c =>
                c.name.toLowerCase().includes(term) || c.id.toLowerCase().includes(term) || (c.type && c.type.toLowerCase().includes(term))
            ).map(c => ({ ...c, layer: 'Business', typeLabel: c.type || 'Business Capability' })));
        }
        if (layerFilters.size === 0 || layerFilters.has('BIAN')) {
            results.push(...catalogData.bians.filter(c =>
                c.name.toLowerCase().includes(term) || c.id.toLowerCase().includes(term) || (c.type && c.type.toLowerCase().includes(term))
            ).map(c => ({ ...c, layer: 'BIAN', typeLabel: c.type || 'Service Domain' })));
        }
        if (layerFilters.size === 0 || layerFilters.has('Data')) {
            results.push(...catalogData.dataCapabilities.filter(c =>
                c.name.toLowerCase().includes(term) || c.id.toLowerCase().includes(term) || (c.type && c.type.toLowerCase().includes(term))
            ).map(c => ({ ...c, layer: 'Data', typeLabel: c.type || 'Data Entity' })));
        }
        if (layerFilters.size === 0 || layerFilters.has('Application')) {
            results.push(...catalogData.abbs.filter(c =>
                c.name.toLowerCase().includes(term) || c.id.toLowerCase().includes(term) || (c.type && c.type.toLowerCase().includes(term))
            ).map(c => ({ ...c, layer: 'Application', typeLabel: c.type || 'Application' })));
        }
        if (layerFilters.size === 0 || layerFilters.has('Technology')) {
            results.push(...catalogData.sbbs.filter(c =>
                c.name.toLowerCase().includes(term) || c.id.toLowerCase().includes(term) || (c.type && c.type.toLowerCase().includes(term))
            ).map(c => ({ ...c, layer: 'Technology', typeLabel: c.type || 'Tech Component' })));
        }

        setSearchResults(results.slice(0, 15));
    }, [searchTerm, catalogData, layerFilters]);

    const handleAddComponent = async (component: any) => {
        // Check if component has relationships in catalog
        const hasRelationships = catalogData?.relationships.some((r: any) =>
            r.businessCapabilityId === component.id ||
            r.dataCapabilityId === component.id ||
            r.abbId === component.id ||
            r.sbbId === component.id
        );

        if (hasRelationships) {
            setPendingAddComponent(component);
            setShowRelationshipModal(true);
        } else {
            await addSingleComponent(component);
        }
    };

    const addSingleComponent = async (component: any) => {
        try {
            const res = await fetch(`/api/projects/${projectId}/changes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'ADD',
                    componentId: component.id,
                    componentType: component.type,
                    description: `Add ${component.name}`,
                    componentName: component.name,
                    componentData: {
                        ...component,
                        name: component.name,
                        layer: component.data?.layer || component.typeLabel || 'Business', // ensure layer exists
                        description: component.description,
                        ...(component.data || {})
                    }
                })
            });

            if (res.ok) {
                fetchChanges();
                setSearchTerm('');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleConfirmImport = async (selectedComponents: any[], relationships: any[]) => {
        setLoading(true); // temporary loading state
        try {
            // 1. Add Main Component
            if (pendingAddComponent) {
                await fetch(`/api/projects/${projectId}/changes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        operation: 'ADD',
                        componentId: pendingAddComponent.id,
                        componentType: pendingAddComponent.type,
                        description: `Add ${pendingAddComponent.name}`,
                        componentData: {
                            ...pendingAddComponent,
                            name: pendingAddComponent.name,
                            layer: pendingAddComponent.data?.layer || pendingAddComponent.typeLabel || pendingAddComponent.layer || 'Business',
                            description: pendingAddComponent.description,
                            ...(pendingAddComponent.data || {})
                        }
                    })
                });
            }

            // 2. Add Selected Related Components
            for (const comp of selectedComponents) {
                await fetch(`/api/projects/${projectId}/changes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        operation: 'ADD',
                        componentId: comp.id,
                        componentType: comp.type,
                        description: `Add ${comp.name} (Related)`,
                        componentData: {
                            ...comp,
                            name: comp.name,
                            layer: comp.data?.layer || comp.typeLabel || comp.layer || 'Business',
                            description: comp.description,
                            ...(comp.data || {})
                        }
                    })
                });
            }

            // 3. Add Relationships
            for (const rel of relationships) {
                // Determine source/target based on catalog structure (usually BC->DC->ABB->SBB)
                // We need to map the catalog relationship to source/target IDs
                let sourceId, targetId;
                if (rel.businessCapabilityId && rel.dataCapabilityId) { sourceId = rel.businessCapabilityId; targetId = rel.dataCapabilityId; }
                else if (rel.dataCapabilityId && rel.abbId) { sourceId = rel.dataCapabilityId; targetId = rel.abbId; }
                else if (rel.abbId && rel.sbbId) { sourceId = rel.abbId; targetId = rel.sbbId; }

                // If we have valid source/target and both are being added (or main is one of them)
                // Actually, we can just add the relationship. The backend view builder will only render edges if both nodes exist.
                if (sourceId && targetId) {
                    await fetch(`/api/projects/${projectId}/changes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            operation: 'ADD_RELATION',
                            componentId: `REL-${sourceId}-${targetId}`, // Generate a deterministic ID for catalog rels
                            componentType: 'relation',
                            description: `Connect ${sourceId} to ${targetId}`,
                            componentData: { sourceId, targetId }
                        })
                    });
                }
            }

            fetchChanges();
            setSearchTerm('');
        } catch (error) {
            console.error("Import error:", error);
        } finally {
            setLoading(false);
            setPendingAddComponent(null);
        }
    };

    const handleCreateComponent = async (component: NewComponent) => {
        // For custom components, add directly as a change with full data
        try {
            const res = await fetch(`/api/projects/${projectId}/changes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'ADD',
                    componentId: component.id,
                    componentType: component.type,
                    description: `Create new: ${component.name}`,
                    componentName: component.name,
                    componentData: {
                        ...component
                    }
                })
            });

            if (res.ok) {
                fetchChanges();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdgeCreate = async (sourceId: string, targetId: string) => {
        try {
            const res = await fetch(`/api/projects/${projectId}/changes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'ADD_RELATION',
                    componentId: `REL-${sourceId}-${targetId}`,
                    componentType: 'relation',
                    description: `Connect ${sourceId} to ${targetId}`,
                    componentData: { sourceId, targetId }
                })
            });

            if (res.ok) {
                fetchChanges();
            }
        } catch (error) {
            console.error('Error creating edge:', error);
        }
    };

    const handleRemoveChange = async (changeId: string) => {
        try {
            await fetch(`/api/projects/${projectId}/changes?changeId=${changeId}`, {
                method: 'DELETE'
            });
            fetchChanges();
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdgeDelete = async (edgeId: string) => {
        try {
            await fetch(`/api/projects/${projectId}/changes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'REMOVE',
                    componentId: edgeId,
                    componentType: 'relation',
                    description: `Remove relationship`
                })
            });
            fetchChanges();
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Error deleting edge:', error);
        }
    };

    // Orphan validation state
    const [orphanError, setOrphanError] = useState<string[] | null>(null);

    const handleCancelEdit = async () => {
        // Clear any staged but unsaved changes? Or just exit edit mode?
        // For now, just exit edit mode - changes are saved as you go
        setIsEditMode(false);
        setOrphanError(null);
    };

    const handleSaveChanges = async () => {
        // Validate: Check for cards without any connections
        try {
            const viewRes = await fetch(`/api/projects/${projectId}/views`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ viewType: 'gap' })
            });

            if (viewRes.ok) {
                const viewData = await viewRes.json();
                const nodes = viewData.nodes || [];
                const edges = viewData.edges || [];

                // Find nodes with no connections
                const nodeIds = new Set(nodes.map((n: any) => n.id));
                const connectedIds = new Set<string>();

                edges.forEach((edge: any) => {
                    connectedIds.add(edge.source);
                    connectedIds.add(edge.target);
                });

                const orphanNodes = nodes.filter((n: any) =>
                    !connectedIds.has(n.id)
                );

                if (orphanNodes.length > 0) {
                    const orphanNames = orphanNodes.map((n: any) =>
                        n.data?.label || n.data?.name || n.id
                    );
                    setOrphanError(orphanNames);
                    return; // Don't exit edit mode
                }
            }
        } catch (error) {
            console.error('Error validating connections:', error);
        }

        // Changes valid — if user is Architect or Chief Architect, prompt for approval submission
        if (role === 'Architect' || role === 'Chief Architect') {
            setShowSubmitDialog(true);
            return;
        }

        // Admins can save directly
        setIsEditMode(false);
        setOrphanError(null);
        fetchChanges();
    };

    const handleDirectSave = () => {
        setIsEditMode(false);
        setOrphanError(null);
        setShowSubmitDialog(false);
        fetchChanges();
    };

    const handleNodeDoubleClick = (node: any) => {
        if (node.data?.layer === 'BIAN' || String(node.data?.type).toUpperCase() === 'SERVICEDOMAIN') {
            setSDMappingNode({ ...node.data, id: node.id });
            setShowSDMappingModal(true);
            return;
        }
        if (!isEditMode) return;
        // Include ID in editingNode state so we can find it later
        setEditingNode({ ...node.data, id: node.id });
        setShowEditModal(true);
    };

    const handleConfirmEdit = async (updatedData: any) => {
        const nodeId = editingNode?.id;
        if (!nodeId) return;

        // 1. Check if we are updating a newly created component (Still ADD operation)
        const creationChange = changes.find(c =>
            c.operation === 'ADD' && c.componentId === nodeId
        );

        if (creationChange) {
            try {
                // Remove old change
                await fetch(`/api/projects/${projectId}/changes?changeId=${creationChange.id}`, {
                    method: 'DELETE'
                });

                // Create new change
                await fetch(`/api/projects/${projectId}/changes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        operation: 'ADD',
                        componentId: nodeId,
                        componentType: updatedData.type,
                        description: `Create new: ${updatedData.name}`,
                        componentName: updatedData.name,
                        componentData: {
                            ...updatedData,
                            id: nodeId
                        }
                    })
                });
                fetchChanges();
                setShowEditModal(false);
            } catch (error) {
                console.error("Error updating component:", error);
            }
        } else {
            // 2. We are modifying an existing Catalog Component (MODIFY operation)
            // Check if there is already a modify change
            const modifyChange = changes.find(c =>
                c.operation === 'MODIFY' && c.componentId === nodeId
            );

            if (modifyChange) {
                // Delete previous modify modification to replace it
                await fetch(`/api/projects/${projectId}/changes?changeId=${modifyChange.id}`, {
                    method: 'DELETE'
                });
            }

            try {
                await fetch(`/api/projects/${projectId}/changes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        operation: 'MODIFY',
                        componentId: nodeId,
                        componentType: updatedData.type, // Should utilize existing type
                        description: `Modify ${updatedData.name}`,
                        componentData: {
                            ...updatedData
                        }
                    })
                });
                fetchChanges();
                setShowEditModal(false);
            } catch (error) {
                console.error("Error modifying component:", error);
            }
        }
    };

    const handleNodeDelete = async (nodeId: string, componentType: string) => {
        const existingRemoval = changes.find(
            c => c.operation === 'REMOVE' && c.componentId === nodeId
        );

        if (existingRemoval) {
            await handleRemoveChange(existingRemoval.id);
        } else {
            try {
                const componentName = catalogData?.businessCapabilities.find(c => c.id === nodeId)?.name ||
                    catalogData?.dataCapabilities.find(c => c.id === nodeId)?.name ||
                    catalogData?.abbs.find(c => c.id === nodeId)?.name ||
                    catalogData?.sbbs.find(c => c.id === nodeId)?.name ||
                    nodeId;

                await fetch(`/api/projects/${projectId}/changes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        operation: 'REMOVE',
                        componentId: nodeId,
                        componentType: componentType,
                        description: `Remove ${componentName}`
                    })
                });
                fetchChanges();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleNodeViewMapping = (node: any) => {
        setSDMappingNode({ ...node.data, id: node.id });
        setShowSDMappingModal(true);
    };

    const handleAdoptTarget = async () => {
        setShowAdoptModal(true);
        setAdoptState('confirm');
    };

    const executeAdoptTarget = async () => {
        setAdoptState('loading');
        setAdoptMessage('Applying changes...');

        try {
            const res = await fetch(`/api/projects/${projectId}/adopt-target`, {
                method: 'POST'
            });

            if (res.status === 202) {
                // Architect: submitted for approval
                const data = await res.json();
                setAdoptState('success');
                setAdoptMessage('✅ Your adoption request has been submitted. A Chief Architect will review and approve it before the changes go live.');
                setTimeout(() => {
                    setShowAdoptModal(false);
                    setIsEditMode(false);
                }, 3500);
            } else if (res.ok) {
                const data = await res.json();
                setAdoptCount(data.details?.count || 0);
                setAdoptState('success');
                setAdoptMessage(`Successfully adopted ${data.details?.count || 0} components!`);

                // Refresh data without page reload
                await fetchProject();
                await fetchChanges();
                await loadCatalog();

                // Wait a moment then transition to AS-IS
                setTimeout(() => {
                    setShowAdoptModal(false);
                    setIsEditMode(false);
                    setViewMode('as-is');
                }, 2000);
            } else {
                const error = await res.json();
                setAdoptState('error');
                setAdoptMessage(error.details || error.error || 'Failed to adopt target');
            }
        } catch (error) {
            setAdoptState('error');
            setAdoptMessage('Network error. Please try again.');
        }
    };

    const handlePublish = async () => {
        setShowAdoptModal(true);
        setAdoptState('confirm');
        setAdoptMessage('This will adopt all changes and set status to "In Progress".');
    };

    const executePublish = async () => {
        setAdoptState('loading');
        setAdoptMessage('Publishing project...');

        try {
            const res = await fetch(`/api/projects/${projectId}/adopt-target`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'In Progress' })
            });

            if (res.ok) {
                const data = await res.json();
                setAdoptState('success');
                setAdoptMessage('Project published successfully!');

                await fetchProject();
                await fetchChanges();
                await loadCatalog();

                setTimeout(() => {
                    setShowAdoptModal(false);
                    setIsEditMode(false);
                    setViewMode('as-is');
                }, 2000);
            } else {
                const error = await res.json();
                setAdoptState('error');
                setAdoptMessage(error.details || error.error || 'Failed to publish');
            }
        } catch (error) {
            setAdoptState('error');
            setAdoptMessage('Network error. Please try again.');
        }
    };

    const getLayerColor = (layer: string) => {
        switch (layer) {
            case 'Business': return 'bg-amber-100 text-amber-800 border bg-amber-200';
            case 'BIAN': return 'bg-rose-100 text-rose-800 border bg-rose-200';
            case 'Data': return 'bg-emerald-100 text-emerald-800 border bg-emerald-200';
            case 'Application': return 'bg-blue-100 text-blue-800 border bg-blue-200';
            case 'Technology': return 'bg-violet-100 text-violet-800 border bg-violet-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div className="p-8">Loading project...</div>;
    if (!project) return <div className="p-8">Project not found</div>;

    const hasChanges = changes.length > 0;
    const addedCount = changes.filter(c => c.operation === 'ADD').length;
    const removedCount = changes.filter(c => c.operation === 'REMOVE').length;

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <button onClick={() => setShowDetailsModal(true)} className="text-left group">
                            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3 group-hover:text-blue-600 transition-colors">
                                {project.name}
                                <Info className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Badge variant={project.status === 'Draft' ? 'outline' : 'default'}
                                    className={project.status === 'Draft' ? 'border-amber-500 text-amber-600' : ''}>
                                    {project.status}
                                </Badge>
                            </h1>
                            <p className="text-sm text-gray-500 mt-1 max-w-2xl truncate group-hover:text-gray-700">
                                {project.description || 'Click to add description'}
                            </p>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Mode Selector */}
                    <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                        <button
                            onClick={() => setViewMode('as-is')}
                            className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'as-is' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            AS-IS
                        </button>
                        <button
                            onClick={() => setViewMode('gap')}
                            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${viewMode === 'gap' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Gap
                            {hasChanges && (
                                <span className="flex items-center gap-0.5 text-xs">
                                    {addedCount > 0 && <span className="text-green-600">+{addedCount}</span>}
                                    {removedCount > 0 && <span className="text-red-600">-{removedCount}</span>}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setViewMode('target')}
                            className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'target' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Target
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-300 mx-2" />

                    {/* Edit Mode Controls */}
                    {role !== 'Viewer' && (
                        !isEditMode ? (
                            <Button onClick={() => { setIsEditMode(true); setViewMode('gap'); }} variant="outline" className="gap-2">
                                <Edit2 className="w-4 h-4" />
                                Edit
                            </Button>
                        ) : (
                            <>
                                <Button onClick={handleCancelEdit} variant="outline" className="gap-2 text-gray-600">
                                    <XCircle className="w-4 h-4" />
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveChanges} className="gap-2 bg-green-600 hover:bg-green-700">
                                    <Save className="w-4 h-4" />
                                    Done
                                </Button>
                            </>
                        )
                    )}

                    {viewMode === 'target' && hasChanges && role !== 'Viewer' && (
                        <Button variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200" onClick={handleAdoptTarget}>
                            <RotateCw className="w-4 h-4 mr-2" />
                            Adopt as AS-IS
                        </Button>
                    )}

                    {project.status === 'Draft' && !isEditMode && role !== 'Viewer' && (
                        <Button onClick={handlePublish} className="bg-indigo-600 hover:bg-indigo-700">
                            <FileEdit className="w-4 h-4 mr-2" />
                            Publish
                        </Button>
                    )}

                    <Button variant="ghost" size="icon" onClick={() => setShowHistoryModal(true)} title="Version History">
                        <History className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden relative flex">
                {/* Mind Map Area */}
                <div className="flex-1 relative">
                    <ReactFlowProvider>
                        <ProjectMindMap
                            projectId={projectId}
                            viewMode={viewMode}
                            isEditMode={isEditMode && viewMode === 'gap'}
                            stagedDeletions={stagedDeletions}
                            onNodeDelete={handleNodeDelete}
                            onEdgeDelete={handleEdgeDelete}
                            onEdgeCreate={handleEdgeCreate}
                            onNodeViewMapping={handleNodeViewMapping}
                            onNodeClick={() => { }}
                            onNodeDoubleClick={handleNodeDoubleClick}
                            refreshKey={changes.length}
                        />
                    </ReactFlowProvider>

                    {/* View Mode Info Overlay */}
                    {viewMode === 'gap' && (
                        <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur rounded-lg shadow-lg border p-3 max-w-xs">
                            <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                Gap Analysis
                            </h4>
                            <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="text-gray-600">Added ({addedCount})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-gray-600">Removed ({removedCount})</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'target' && (
                        <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur rounded-lg shadow-lg border p-3 max-w-xs">
                            <h4 className="text-sm font-semibold text-gray-800 mb-1">Target State</h4>
                            <p className="text-xs text-gray-500">Final architecture after all changes are implemented.</p>
                        </div>
                    )}
                </div>

                {/* Edit Panel (Gap mode when editing) */}
                {isEditMode && viewMode === 'gap' && (
                    <div className="absolute bottom-6 right-6 z-20">
                        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden w-[550px]">
                            {/* Header with Create Button */}
                            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Edit2 className="w-4 h-4 text-green-600" />
                                        <span className="text-sm font-semibold text-gray-700">Edit Architecture</span>
                                    </div>
                                    <Button
                                        onClick={() => setShowCreateModal(true)}
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        New Card
                                    </Button>
                                </div>

                                {/* Layer Filter */}
                                <div className="flex items-center gap-2 mb-3">
                                    <Filter className="w-4 h-4 text-gray-400" />
                                    <div className="flex gap-1 flex-wrap">
                                        {(['Business', 'BIAN', 'Application', 'Data', 'Technology'] as const).map(filter => {
                                            const isActive = layerFilters.has(filter);
                                            const toggleFilter = () => {
                                                const newFilters = new Set(layerFilters);
                                                if (newFilters.has(filter)) {
                                                    newFilters.delete(filter);
                                                } else {
                                                    newFilters.add(filter);
                                                }
                                                setLayerFilters(newFilters);
                                            };
                                            return (
                                                <button
                                                    key={filter}
                                                    onClick={toggleFilter}
                                                    className={`px-3 py-1.5 font-medium text-xs rounded-full transition-all border ${isActive
                                                        ? 'bg-blue-600 text-white shadow focus:ring-2 focus:ring-blue-500'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {filter}
                                                </button>
                                            );
                                        })}
                                        {layerFilters.size > 0 && (
                                            <button
                                                onClick={() => setLayerFilters(new Set())}
                                                className="px-2 py-1 text-xs rounded-md text-red-500 hover:bg-red-50"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search catalog to add components..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
                                        {searchResults.map(comp => (
                                            <button
                                                key={comp.id}
                                                onClick={() => handleAddComponent(comp)}
                                                className="w-full text-left px-3 py-2 hover:bg-green-50 flex items-center justify-between"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 truncate">{comp.name}</div>
                                                    <div className="text-xs text-gray-500">{comp.id}</div>
                                                </div>
                                                <span className={`ml-2 px-2 py-0.5 text-[0.65rem] font-bold tracking-wider uppercase rounded ${getLayerColor(comp.layer)}`}>
                                                    {comp.typeLabel}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pending Changes */}
                            {hasChanges && (
                                <div className="p-4 bg-gray-50 max-h-40 overflow-y-auto">
                                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                        Pending Changes ({changes.length})
                                    </div>
                                    <div className="space-y-1">
                                        {changes.map(change => (
                                            <div key={change.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${change.operation === 'ADD' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                                }`}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${change.operation === 'ADD' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                                        }`}>
                                                        {change.operation === 'ADD' ? '+' : '-'}
                                                    </span>
                                                    <span className="text-sm text-gray-700">{change.description}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveChange(change.id)}
                                                    className="text-gray-400 hover:text-red-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Instructions */}
                            {!hasChanges && (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    <p>Click on cards to remove them • Search to add from catalog • Create new cards</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* No Changes Info for Gap/Target - Only show if NOT in edit mode and NO changes */}
                {viewMode !== 'as-is' && !hasChanges && !isEditMode && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
                        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200">
                            <FileEdit className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No changes yet</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Switch to AS-IS view and click Edit to make changes.
                            </p>
                            <Button onClick={() => { setIsEditMode(true); }} variant="outline">
                                Start Editing
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {project && (
                <ProjectDetailsModal
                    project={project}
                    isOpen={showDetailsModal}
                    onClose={() => setShowDetailsModal(false)}
                    onSave={(updates) => setProject({ ...project, ...updates })}
                />
            )}

            <CreateComponentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={handleCreateComponent}
            />

            <EditComponentModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={handleConfirmEdit}
                component={editingNode}
                isCustom={editingNode?.changeStatus === 'added' || (editingNode?.id && editingNode.id.startsWith('CUSTOM-'))}
            />

            <RelationshipSelectorModal
                isOpen={showRelationshipModal}
                onClose={() => setShowRelationshipModal(false)}
                onConfirm={handleConfirmImport}
                mainComponent={pendingAddComponent}
                catalogData={catalogData}
            />

            <VersionHistoryModal
                projectId={projectId}
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                onRestore={() => { fetchProject(); fetchChanges(); }}
            />

            {/* Orphan Cards Error Modal */}
            {orphanError && orphanError.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOrphanError(null)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <AlertCircle className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Cards sem conexões
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Os seguintes cards não têm nenhuma conexão. Adicione ligações ou remova-os:
                            </p>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
                                <ul className="text-left space-y-1">
                                    {orphanError.map((name, i) => (
                                        <li key={i} className="text-sm text-amber-800 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                                            {name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button
                                onClick={() => setOrphanError(null)}
                                className="w-full bg-amber-600 hover:bg-amber-700"
                            >
                                Entendido
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Adopt Target Modal */}
            {showAdoptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => adoptState !== 'loading' && setShowAdoptModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all duration-300 animate-in zoom-in-95">
                        {adoptState === 'confirm' && (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Adopt as AS-IS?</h3>
                                <p className="text-gray-500 mb-6">
                                    This will apply all {changes.length} pending changes and update the project's baseline architecture.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAdoptModal(false)}
                                        className="px-6"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={executeAdoptTarget}
                                        className="px-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                                    >
                                        Confirm Adoption
                                    </Button>
                                </div>
                            </div>
                        )}

                        {adoptState === 'loading' && (
                            <div className="text-center py-6">
                                <div className="relative w-20 h-20 mx-auto mb-4">
                                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-1">Applying Changes...</h3>
                                <p className="text-sm text-gray-500">{adoptMessage}</p>
                            </div>
                        )}

                        {adoptState === 'success' && (
                            <div className="text-center py-4">
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-in zoom-in-95">
                                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
                                <p className="text-gray-500 mb-2">{adoptMessage}</p>
                                <p className="text-sm text-emerald-600 font-medium">Transitioning to AS-IS view...</p>
                            </div>
                        )}

                        {adoptState === 'error' && (
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Error</h3>
                                <p className="text-red-600 mb-4">{adoptMessage}</p>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAdoptModal(false)}
                                >
                                    Close
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ServiceDomainMappingModal
                isOpen={showSDMappingModal}
                onClose={() => {
                    setShowSDMappingModal(false);
                    setSDMappingNode(null);
                }}
                component={sdMappingNode}
                projectId={projectId}
            />

            {/* Submit for Approval Dialog */}
            {showSubmitDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-8 flex flex-col gap-5">
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                                <FileEdit className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Submit Changes for Approval</h2>
                            <p className="text-sm text-slate-500">
                                Your architectural changes are saved as a draft. To finalize and apply them to the Target Architecture, they must be approved by a <span className="font-semibold text-indigo-600">Chief Architect</span>.
                            </p>
                            <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100 w-full">
                                Go to <strong>Gap Analysis</strong> → open this project → define a Roadmap → click <strong>&ldquo;Submit for Approval&rdquo;</strong>. The Chief Architect will then review and approve your changes.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => { router.push('/gap-analysis'); setShowSubmitDialog(false); setIsEditMode(false); }}
                                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors"
                            >
                                Go to Gap Analysis →
                            </button>
                            <button
                                onClick={handleDirectSave}
                                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-medium text-sm transition-colors"
                            >
                                Save as Draft &amp; Exit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
