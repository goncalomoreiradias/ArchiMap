"use client"

import { useState, useTransition, useMemo } from "react"
import { Layers, Database, Boxes, Server, Activity } from "lucide-react"

import { deleteComponent, DeleteResult } from "@/app/actions/components"

// New Imports
import { DataTable } from "./components-table/data-table"
// columns must be a factory to accept handlers
import { getColumns, ComponentDef } from "./components-table/columns"
import { ComponentSheet } from "./components-table/component-sheet"

type ComponentItem = {
    id: string
    name: string
    description?: string
    layer: string
    [key: string]: any
}

type ComponentsViewProps = {
    groupedComponents: Record<string, ComponentItem[]>
}

export function ComponentsView({ groupedComponents }: ComponentsViewProps) {
    const [selectedComponent, setSelectedComponent] = useState<ComponentItem | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [deleteStatus, setDeleteStatus] = useState<DeleteResult | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Flatten data for table
    const data = useMemo(() => {
        return Object.values(groupedComponents).flat().map(c => ({
            ...c,
            // ensure types match expected defaults if missing
            status: c.status || (c.type === 'Target' ? 'Target' : 'AS-IS')
        }))
    }, [groupedComponents])

    // Handle auto-open via URL parameter
    useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const id = params.get('id');
            if (id && data.length > 0) {
                const comp = data.find(c => c.id === id);
                if (comp) {
                    // We need to wait for mount to call handleView properly or just set initial state
                    // But simplified for now:
                    setTimeout(() => handleView(comp as any), 100);
                }
            }
        }
    });

    // Calculate stats
    const stats = useMemo(() => ({
        total: data.length,
        business: data.filter(c => c.layer === 'Business').length,
        bian: data.filter(c => c.layer === 'BIAN').length,
        application: data.filter(c => c.layer === 'Application').length,
        data_layer: data.filter(c => c.layer === 'Data').length,
        technology: data.filter(c => c.layer === 'Technology').length
    }), [data])

    // Handlers
    const handleView = (component: ComponentDef) => {
        setSelectedComponent(component as ComponentItem)
        setDeleteStatus(null)
        setShowDeleteConfirm(false)
        setIsSheetOpen(true)
    }

    const handleDeleteClick = (component: ComponentDef) => {
        setSelectedComponent(component as ComponentItem)
        // Reset delete state before opening
        setDeleteStatus(null)
        setShowDeleteConfirm(false)
        setIsSheetOpen(true)
    }

    const handleDeleteAction = (force: boolean) => {
        if (!selectedComponent) return

        startTransition(async () => {
            const result = await deleteComponent(selectedComponent.id, force)

            if (result.success) {
                setDeleteStatus(null)
                setShowDeleteConfirm(false)
                setIsSheetOpen(false)
                setSelectedComponent(null)
            } else {
                setDeleteStatus(result)
                if (result.dependencies) {
                    setShowDeleteConfirm(true)
                }
            }
        })
    }

    // Define columns with handlers
    const columns = useMemo(() => getColumns(handleView, handleDeleteClick), [])

    return (
        <div className="flex flex-col h-[calc(100vh-1rem)] bg-slate-50/50 dark:bg-zinc-950 overflow-hidden relative">

            {/* Minimal Header */}
            <div className="px-8 py-6 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm z-10 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Component Catalog
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manage your architectural building blocks.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-8 z-0">
                <div className="max-w-[1600px] mx-auto">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Business</p>
                                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{stats.business}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl"><Layers size={22} /></div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">BIAN</p>
                                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{stats.bian}</h3>
                            </div>
                            <div className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-xl"><Activity size={22} /></div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Application</p>
                                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{stats.application}</h3>
                            </div>
                            <div className="p-3 bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 rounded-xl"><Boxes size={22} /></div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Data</p>
                                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{stats.data_layer}</h3>
                            </div>
                            <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl"><Database size={22} /></div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Technology</p>
                                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{stats.technology}</h3>
                            </div>
                            <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-xl"><Server size={22} /></div>
                        </div>
                    </div>

                    <DataTable columns={columns} data={data} onRowClick={(c) => handleView(c)} />
                </div>
            </div>

            <ComponentSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                component={selectedComponent}
                onDelete={handleDeleteAction}
                isDeleting={isPending}
                deleteStatus={deleteStatus}
                showDeleteConfirm={showDeleteConfirm}
            />
        </div>
    )
}
