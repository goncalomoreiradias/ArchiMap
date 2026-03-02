import { create } from 'zustand';
import {
    Edge,
    Node,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    Connection
} from '@xyflow/react';

// Domain Types
export type Layer = 'Business' | 'BIAN' | 'Application' | 'Technology' | 'Data';
export type Status = 'As-Is' | 'Target' | 'Transitional';

export interface ArchComponent {
    id: string;
    name: string;
    layer: Layer;
    type: string; // e.g., 'Process', 'Service', 'Server'
    status: Status;
    description?: string;
    validFrom?: Date | string;
    validTo?: Date | string;
}

// Catalog Types
export interface CatalogComponent {
    id: string;
    name: string;
    [key: string]: any;
}

export interface CatalogData {
    businessCapabilities: CatalogComponent[];
    dataCapabilities: CatalogComponent[];
    abbs: CatalogComponent[];
    sbbs: CatalogComponent[];
    bians: CatalogComponent[];
    relationships: any[];
}

// Store State
interface ArchState {
    components: ArchComponent[];
    nodes: Node[];
    edges: Edge[];

    // Catalog state
    catalogData: CatalogData | null;
    selectedComponent: { id: string; type: string } | null;
    isLoadingCatalog: boolean;

    // Actions
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addComponent: (component: ArchComponent, position: { x: number, y: number }) => void;
    updateComponent: (id: string, data: Partial<ArchComponent>) => void;
    fetchComponents: () => Promise<void>;
    addComponentAsync: (data: Partial<ArchComponent>) => Promise<ArchComponent | null>;

    // Catalog actions
    loadCatalog: () => Promise<void>;
    selectComponent: (id: string, type: string) => Promise<void>;
    toggleComponent: (id: string, type: string) => Promise<void>;
    clearVisualization: () => void;
    removeSelectedComponent: (id: string) => void;
    selectedComponents: Array<{ id: string; type: string }>;
}

// Helper to get color by layer
const getLayerColor = (layer: Layer) => {
    switch (layer) {
        case 'Business': return '#fbbf24'; // amber-400
        case 'Application': return '#60a5fa'; // blue-400
        case 'Data': return '#34d399'; // emerald-400
        case 'Technology': return '#a78bfa'; // violet-400
        default: return '#9ca3af';
    }
};

export const useArchStore = create<ArchState>((set, get) => ({
    components: [],
    nodes: [],
    edges: [],

    // Catalog state
    catalogData: null,
    selectedComponent: null,
    selectedComponents: [],
    isLoadingCatalog: false,

    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },

    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });
    },

    addComponent: (component, position) => {
        const newNode: Node = {
            id: component.id,
            position,
            type: 'archNode',
            data: {
                label: component.name,
                layer: component.layer,
                status: component.status,
                type: component.type
            },
        };

        set((state) => ({
            components: [...state.components, component],
            nodes: [...state.nodes, newNode],
        }));
    },

    updateComponent: (id, data) => {
        set((state) => ({
            components: state.components.map((c) => (c.id === id ? { ...c, ...data } : c)),
            nodes: state.nodes.map((n) =>
                n.id === id
                    ? { ...n, data: { ...n.data, label: data.name || n.data.label } }
                    : n
            ),
        }));
    },

    fetchComponents: async () => {
        try {
            const res = await fetch('/api/components');
            if (!res.ok) throw new Error('Failed');
            const data: ArchComponent[] = await res.json();

            const nodes: Node[] = data.map((c, i) => ({
                id: c.id,
                type: 'archNode',
                position: { x: Math.random() * 800, y: Math.random() * 600 },
                data: {
                    label: c.name,
                    layer: c.layer,
                    status: c.status,
                    type: c.type,
                    validFrom: c.validFrom,
                    validTo: c.validTo
                }
            }));

            // Fetch relationships
            const relRes = await fetch('/api/relationships');
            console.log('Fetching Components Status:', res.status);

            let edges: Edge[] = [];
            if (relRes.ok) {
                const relData = await relRes.json();
                console.log('Fetched Relationships:', relData.length);
                edges = relData.map((r: any) => ({
                    id: r.id,
                    source: r.sourceId,
                    target: r.targetId,
                    animated: true,
                    label: r.type,
                    style: { stroke: '#9ca3af' }
                }));
            }

            console.log('Updating Store with Nodes:', nodes.length, 'Edges:', edges.length);
            set({ components: data, nodes, edges });
        } catch (error) {
            console.error('Fetch Error:', error);
        }
    },

    addComponentAsync: async (componentData: Partial<ArchComponent>) => {
        try {
            // Basic mock user context if client side doesn't pass everything
            const res = await fetch('/api/components', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(componentData)
            });

            if (!res.ok) throw new Error('Failed to create');
            const newComponent: ArchComponent = await res.json();

            const newNode: Node = {
                id: newComponent.id,
                position: { x: Math.random() * 400, y: Math.random() * 400 },
                type: 'archNode',
                data: {
                    label: newComponent.name,
                    layer: newComponent.layer,
                    status: newComponent.status,
                    type: newComponent.type,
                    validFrom: newComponent.validFrom,
                    validTo: newComponent.validTo
                },
            };

            set((state) => ({
                components: [...state.components, newComponent],
                nodes: [...state.nodes, newNode],
            }));

            return newComponent;
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    loadCatalog: async () => {
        try {
            set({ isLoadingCatalog: true });
            const res = await fetch('/api/catalog');
            if (!res.ok) throw new Error('Failed to load catalog');
            const data: CatalogData = await res.json();
            set({ catalogData: data, isLoadingCatalog: false });
        } catch (error) {
            console.error('Error loading catalog:', error);
            set({ isLoadingCatalog: false });
        }
    },

    selectComponent: async (id: string, type: string) => {
        try {
            // Set single selection
            const newSelected = [{ id, type }];

            set({
                selectedComponent: { id, type },
                selectedComponents: newSelected
            });

            const res = await fetch('/api/catalog/graph', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ components: newSelected })
            });

            if (!res.ok) throw new Error('Failed to build graph');
            const { nodes, edges } = await res.json();
            set({ nodes, edges });
        } catch (error) {
            console.error('Error selecting component:', error);
        }
    },

    toggleComponent: async (id: string, type: string) => {
        try {
            const currentSelected = get().selectedComponents;
            const isAlreadySelected = currentSelected.some(c => c.id === id);
            let newSelected: Array<{ id: string; type: string }>;

            if (isAlreadySelected) {
                newSelected = currentSelected.filter(c => c.id !== id);
            } else {
                newSelected = [...currentSelected, { id, type }];
            }

            // Update selection state immediately
            set({
                selectedComponent: newSelected.length > 0 ? newSelected[newSelected.length - 1] : null,
                selectedComponents: newSelected
            });

            if (newSelected.length === 0) {
                set({ nodes: [], edges: [] });
                return;
            }

            // Call API with ALL selected components
            // The backend handles intersection logic if > 1 component
            const res = await fetch('/api/catalog/graph', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ components: newSelected })
            });

            if (!res.ok) throw new Error('Failed to build graph');
            const { nodes, edges } = await res.json();
            set({ nodes, edges });

        } catch (error) {
            console.error('Error toggling component:', error);
        }
    },

    removeSelectedComponent: (id: string) => {
        const comp = get().selectedComponents.find(c => c.id === id);
        if (comp) {
            get().toggleComponent(id, comp.type);
        }
    },

    clearVisualization: () => {
        set({
            nodes: [],
            edges: [],
            selectedComponent: null,
            selectedComponents: []
        });
    },
}));

