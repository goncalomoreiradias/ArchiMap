"use client"

import { Table } from "@tanstack/react-table"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "./faceted-filter"
import { Layers, Activity, Search, Box } from "lucide-react"

interface ComponentTableToolbarProps<TData> {
    table: Table<TData>
}

// Reuse layer config structure or options
const layers = [
    { value: "Business", label: "Business", icon: Layers },
    { value: "BIAN", label: "BIAN", icon: Layers },
    { value: "Application", label: "Application", icon: Layers },
    { value: "Data", label: "Data", icon: Layers },
    { value: "Technology", label: "Technology", icon: Layers },
]

const statuses = [
    { value: "AS-IS", label: "AS-IS", icon: Activity },
    { value: "Target", label: "Target", icon: Activity },
    { value: "Gap", label: "Gap", icon: Activity },
]

const componentTypes = [
    { value: "BusinessCapability", label: "Business Capability", icon: Box },
    { value: "BusinessProcess", label: "Business Process", icon: Box },
    { value: "ValueStream", label: "Value Stream", icon: Box },
    { value: "ServiceDomain", label: "Service Domain", icon: Box },
    { value: "ServiceOperation", label: "Service Operation", icon: Box },
    { value: "BusinessObject", label: "Business Object", icon: Box },
    { value: "Application", label: "Application", icon: Box },
    { value: "ApplicationComponent", label: "Application Component", icon: Box },
    { value: "Interface", label: "Interface", icon: Box },
    { value: "DataEntity", label: "Data Entity", icon: Box },
    { value: "API", label: "API", icon: Box },
    { value: "DataFlow", label: "Data Flow", icon: Box },
    { value: "TechComponent", label: "Tech Component", icon: Box },
    { value: "InfrastructureService", label: "Infrastructure Service", icon: Box },
    { value: "IntegrationPlatform", label: "Integration Platform", icon: Box },
]

export function ComponentTableToolbar<TData>({
    table,
}: ComponentTableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter components..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="h-9 w-[150px] lg:w-[250px] pl-8 bg-white dark:bg-zinc-900"
                    />
                </div>

                {table.getColumn("layer") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("layer")}
                        title="Layer"
                        options={layers}
                    />
                )}

                {table.getColumn("type") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("type")}
                        title="Type"
                        options={componentTypes}
                    />
                )}

                {table.getColumn("status") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("status")}
                        title="Status"
                        options={statuses}
                    />
                )}

                {isFiltered && (
                    <Button
                        variant="ghost"
                        onClick={() => table.resetColumnFilters()}
                        className="h-8 px-2 lg:px-3 text-slate-500 hover:text-slate-900"
                    >
                        Reset
                        <Cross2Icon className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
