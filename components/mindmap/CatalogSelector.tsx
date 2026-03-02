"use client"

import { useEffect, useState } from 'react';
import { Search, X, Filter, ChevronDown, ChevronUp, Minus, Layers } from 'lucide-react';
import { useArchStore } from '@/store/useArchStore';
import { motion, AnimatePresence } from 'framer-motion';

type ComponentType = 'bc' | 'bian' | 'dc' | 'abb' | 'sbb';

interface ComponentOption {
    id: string;
    name: string;
    type: ComponentType;
    typeLabel: string;
    exactType: string;
    metadata?: string;
    description?: string;
    isFuture?: boolean;
}

const TYPE_CONFIG = {
    bc: { label: 'Business Capability', short: 'BC', color: 'amber', layer: 'Business' },
    bian: { label: 'BIAN Domain', short: 'BIAN', color: 'rose', layer: 'BIAN' },
    dc: { label: 'Data Capability', short: 'DC', color: 'emerald', layer: 'Data' },
    abb: { label: 'Architecture Building Block', short: 'ABB', color: 'blue', layer: 'Application' },
    sbb: { label: 'Solution Building Block', short: 'SBB', color: 'violet', layer: 'Technology' }
};

export function CatalogSelector() {
    const { catalogData, loadCatalog, toggleComponent, clearVisualization, selectedComponents, isLoadingCatalog } = useArchStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Set<ComponentType>>(new Set());
    const [activeSpecificTypes, setActiveSpecificTypes] = useState<Set<string>>(new Set());
    const [allOptions, setAllOptions] = useState<ComponentOption[]>([]);
    const [showFilters, setShowFilters] = useState(true);
    const [expandedSections, setExpandedSections] = useState<Set<ComponentType>>(new Set());

    // UI State
    const [isMinimized, setIsMinimized] = useState(true);

    useEffect(() => {
        loadCatalog();
    }, [loadCatalog]);

    useEffect(() => {
        if (!catalogData) return;

        const options: ComponentOption[] = [
            ...catalogData.businessCapabilities.map(bc => ({
                id: bc.id,
                name: bc.name,
                type: 'bc' as ComponentType,
                typeLabel: 'Business Capability',
                exactType: bc.type || 'Business Capability',
                metadata: bc.domainArea,
                description: bc.bcL3 || bc.bcL2 || bc.bcL1,
                isFuture: bc.isFuture
            })),
            ...catalogData.bians.map(bian => ({
                id: bian.id,
                name: bian.name,
                type: 'bian' as ComponentType,
                typeLabel: 'BIAN Domain',
                exactType: bian.type || 'Service Domain',
                metadata: bian.domainArea,
                description: bian.description,
                isFuture: bian.isFuture
            })),
            ...catalogData.dataCapabilities.map(dc => ({
                id: dc.id,
                name: dc.name,
                type: 'dc' as ComponentType,
                typeLabel: 'Data Capability',
                exactType: dc.type || 'Data Capability',
                metadata: dc.pattern,
                description: dc.pattern,
                isFuture: dc.isFuture
            })),
            ...catalogData.abbs.map(abb => ({
                id: abb.id,
                name: abb.name,
                type: 'abb' as ComponentType,
                typeLabel: 'ABB',
                exactType: abb.type || 'Application',
                metadata: abb.domain,
                description: abb.domain,
                isFuture: abb.isFuture
            })),
            ...catalogData.sbbs.map(sbb => ({
                id: sbb.id,
                name: sbb.name,
                type: 'sbb' as ComponentType,
                typeLabel: 'SBB',
                exactType: sbb.type || 'Technology',
                metadata: sbb.vendor,
                description: sbb.notes,
                isFuture: sbb.isFuture
            }))
        ];

        setAllOptions(options);
    }, [catalogData]);

    // Extract unique specific component types existing in allOptions, filtered by active layer filters
    const availableSpecificTypes = Array.from(new Set(
        allOptions
            .filter(o => activeFilters.size === 0 || activeFilters.has(o.type))
            .map(o => o.exactType)
            .filter(Boolean)
    )).sort();

    // Filter by search term AND active type filters
    const filteredOptions = allOptions.filter(option => {
        const matchesSearch = searchTerm === '' ||
            option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (option.metadata && option.metadata.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesLayerFilter = activeFilters.size === 0 || activeFilters.has(option.type);
        const matchesSpecificTypeFilter = activeSpecificTypes.size === 0 || activeSpecificTypes.has(option.exactType);

        return matchesSearch && matchesLayerFilter && matchesSpecificTypeFilter;
    });

    const groupedOptions = {
        bc: filteredOptions.filter(o => o.type === 'bc'),
        bian: filteredOptions.filter(o => o.type === 'bian'),
        dc: filteredOptions.filter(o => o.type === 'dc'),
        abb: filteredOptions.filter(o => o.type === 'abb'),
        sbb: filteredOptions.filter(o => o.type === 'sbb')
    };

    const handleSelect = (option: ComponentOption) => {
        // Use toggleComponent for additive selection
        toggleComponent(option.id, option.type);
        setSearchTerm('');
    };

    const handleClear = () => {
        clearVisualization();
        setSearchTerm('');
    };

    const handleClearAllFilters = () => {
        setActiveFilters(new Set());
        setActiveSpecificTypes(new Set());
    };

    const toggleSpecificFilter = (type: string) => {
        const newFilters = new Set(activeSpecificTypes);
        if (newFilters.has(type)) {
            newFilters.delete(type);
        } else {
            newFilters.add(type);
        }
        setActiveSpecificTypes(newFilters);
    };

    const toggleFilter = (type: ComponentType) => {
        const newFilters = new Set(activeFilters);
        if (newFilters.has(type)) {
            newFilters.delete(type);
        } else {
            newFilters.add(type);
        }
        setActiveFilters(newFilters);
    };

    const toggleSection = (type: ComponentType) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(type)) {
            newExpanded.delete(type);
        } else {
            newExpanded.add(type);
        }
        setExpandedSections(newExpanded);
    };

    const getTypeStyles = (type: ComponentType, isActive: boolean) => {
        const config = TYPE_CONFIG[type];
        if (isActive) {
            return `bg-${config.color}-500 text-white border-${config.color}-600 ring-2 ring-${config.color}-300`;
        }
        return `bg-${config.color}-50 text-${config.color}-700 border-${config.color}-200 hover:bg-${config.color}-100`;
    };

    if (isLoadingCatalog) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-4 w-96">
                <div className="text-sm text-gray-500">Loading catalog...</div>
            </div>
        );
    }

    const hasResults = filteredOptions.length > 0;
    const showDropdown = searchTerm.length > 0 || activeFilters.size > 0;

    return (
        <AnimatePresence mode="wait">
            {isMinimized ? (
                <motion.button
                    key="minimized"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMinimized(false)}
                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl rounded-full px-4 py-3 flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                    <Layers className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm font-semibold">Catalog</span>
                    {selectedComponents.length > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {selectedComponents.length}
                        </span>
                    )}
                </motion.button>
            ) : (
                <motion.div
                    key="maximized"
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    className="bg-white rounded-lg shadow-2xl w-[28rem] flex flex-col border border-slate-200 max-h-[85vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2.5 truncate whitespace-nowrap">
                                <Layers className="w-5 h-5 text-indigo-500 shrink-0" />
                                <span>Architecture Catalog</span>
                            </h3>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`p-1.5 rounded-full transition-colors ${showFilters ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                    title="Toggle Filters"
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="p-1.5 rounded-full transition-colors bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                    title="Minimize Catalog"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                        {/* Filter Section */}
                        {showFilters && (
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                <div className="mb-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Filter by Layer</span>
                                        {activeFilters.size > 0 && (
                                            <button
                                                onClick={handleClearAllFilters}
                                                className="text-xs text-red-500 hover:text-red-700"
                                            >
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(Object.keys(TYPE_CONFIG) as ComponentType[]).map(type => {
                                            const config = TYPE_CONFIG[type];
                                            const isActive = activeFilters.has(type);
                                            const count = type === 'bc' ? catalogData?.businessCapabilities.length :
                                                type === 'bian' ? catalogData?.bians?.length :
                                                    type === 'dc' ? catalogData?.dataCapabilities.length :
                                                        type === 'abb' ? catalogData?.abbs.length :
                                                            catalogData?.sbbs.length;

                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => toggleFilter(type)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isActive
                                                        ? `bg-${config.color}-500 text-white border-${config.color}-600 shadow-sm`
                                                        : `bg-${config.color}-50 text-${config.color}-700 border-${config.color}-200 hover:bg-${config.color}-100`
                                                        }`}
                                                    style={{
                                                        backgroundColor: isActive ? `var(--${config.color}-500, ${config.color === 'amber' ? '#f59e0b' : config.color === 'rose' ? '#f43f5e' : config.color === 'emerald' ? '#10b981' : config.color === 'blue' ? '#3b82f6' : '#8b5cf6'})` : undefined,
                                                        color: isActive ? 'white' : undefined
                                                    }}
                                                >
                                                    <span>{config.short}</span>
                                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-black/5'}`}>
                                                        {count || 0}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                {availableSpecificTypes.length > 0 && (
                                    <div className="mb-1 mt-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Filter by Component Type</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {availableSpecificTypes.map(specificType => {
                                                const isActive = activeSpecificTypes.has(specificType);
                                                return (
                                                    <button
                                                        key={specificType}
                                                        onClick={() => toggleSpecificFilter(specificType)}
                                                        className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium border transition-all ${isActive
                                                            ? 'bg-slate-600 text-white border-slate-700 shadow-sm'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                                                    >
                                                        {specificType}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Active Filters Display */}
                        {(activeFilters.size > 0 || activeSpecificTypes.size > 0) && (
                            <div className="px-5 pt-4 pb-2">
                                <div className="p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs text-indigo-500 font-medium">Active:</span>
                                        {Array.from(activeFilters).map(type => (
                                            <span
                                                key={type}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg text-xs font-medium border border-slate-200 shadow-sm"
                                            >
                                                {TYPE_CONFIG[type].label}
                                                <button onClick={() => toggleFilter(type)} className="hover:text-red-500 transition-colors">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                        {Array.from(activeSpecificTypes).map(type => (
                                            <span
                                                key={`spec-${type}`}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg text-xs font-medium border border-slate-200 shadow-sm"
                                            >
                                                {type}
                                                <button onClick={() => toggleSpecificFilter(type)} className="hover:text-red-500 transition-colors">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Search Input */}
                        <div className="p-5 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search components..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Selected Components Display */}
                        {selectedComponents.length > 0 && (
                            <div className="px-5 pt-4 pb-2">
                                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-xs text-blue-700 font-semibold tracking-wide">SELECTED ({selectedComponents.length})</div>
                                        <button
                                            onClick={handleClear}
                                            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedComponents.map(comp => {
                                            const option = allOptions.find(o => o.id === comp.id);
                                            const config = TYPE_CONFIG[comp.type as ComponentType];
                                            return (
                                                <span
                                                    key={comp.id}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg text-xs font-medium border border-slate-200 shadow-sm"
                                                >
                                                    <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: config?.color === 'amber' ? '#f59e0b' : config?.color === 'emerald' ? '#10b981' : config?.color === 'blue' ? '#3b82f6' : '#8b5cf6' }} />
                                                    {option?.name || comp.id}
                                                    <button
                                                        onClick={() => toggleComponent(comp.id, comp.type)}
                                                        className="hover:text-red-500 transition-colors ml-0.5"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Results Dropdown */}
                        {showDropdown && (
                            <div className="border-t border-gray-100 pb-2">
                                {!hasResults ? (
                                    <div className="p-8 text-center">
                                        <div className="text-gray-400 mb-2">
                                            <Search className="w-8 h-8 mx-auto" />
                                        </div>
                                        <p className="text-sm text-gray-500">No components match your filters</p>
                                        <button
                                            onClick={handleClearAllFilters}
                                            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            Clear filters
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-2 space-y-3">
                                        {(['bc', 'bian', 'dc', 'abb', 'sbb'] as ComponentType[]).map(type => {
                                            const items = groupedOptions[type];
                                            if (items.length === 0) return null;

                                            const config = TYPE_CONFIG[type];
                                            const isExpanded = expandedSections.has(type);
                                            const displayedItems = isExpanded ? items : items.slice(0, 8);
                                            const remainingCount = items.length - 8;

                                            return (
                                                <div key={type}>
                                                    <div className={`px-2 py-1 text-xs font-semibold uppercase tracking-wider rounded bg-${config.color}-50 text-${config.color}-700`}
                                                        style={{ backgroundColor: `${config.color === 'amber' ? '#fffbeb' : config.color === 'rose' ? '#ffe4e6' : config.color === 'emerald' ? '#ecfdf5' : config.color === 'blue' ? '#eff6ff' : '#f5f3ff'}` }}>
                                                        {config.label} ({items.length})
                                                    </div>
                                                    {displayedItems.map(option => (
                                                        <button
                                                            key={option.id}
                                                            onClick={() => handleSelect(option)}
                                                            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-${config.color}-50 transition-colors`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="text-sm font-medium text-gray-900 truncate">{option.name}</div>
                                                                {option.isFuture && (
                                                                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                                        New
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate">{option.id}</div>
                                                        </button>
                                                    ))}
                                                    {items.length > 8 && (
                                                        <button
                                                            onClick={() => toggleSection(type)}
                                                            className="w-full text-left px-3 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors flex items-center justify-between"
                                                        >
                                                            <span>
                                                                {isExpanded ? 'Show less' : `+${remainingCount} more...`}
                                                            </span>
                                                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
