"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, Eye, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// This type is used to define the shape of our data.
export type ComponentDef = {
    id: string
    name: string
    description?: string
    layer: string
    status?: string
    // Allow other props
    [key: string]: any
}

const LAYER_COLORS: Record<string, string> = {
    Business: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
    BIAN: "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200",
    Application: "bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200",
    Data: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200",
    Technology: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200",
}

export const getColumns = (
    onView: (c: ComponentDef) => void,
    onDelete: (c: ComponentDef) => void
): ColumnDef<ComponentDef>[] => [

        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 hover:bg-slate-100"
                    >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="font-semibold text-slate-900 dark:text-slate-100">{row.getValue("name")}</div>,
            filterFn: (row, id, value) => {
                const rowValue = row.getValue(id) as string;
                if (!rowValue) return false;
                return rowValue.toLowerCase().includes((value as string).toLowerCase());
            },
        },
        {
            accessorKey: "layer",
            header: "Layer",
            cell: ({ row }) => {
                const layer = row.getValue("layer") as string
                const colorClass = LAYER_COLORS[layer] || "bg-slate-100 text-slate-700 border-slate-200"

                return (
                    <Badge variant="outline" className={`${colorClass} font-mono shadow-sm`}>
                        {layer}
                    </Badge>
                )
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => {
                const type = row.getValue("type") as string
                if (!type) return <span className="text-slate-300 text-xs">-</span>
                return (
                    <div className="text-slate-500 text-sm whitespace-nowrap">{type}</div>
                )
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                if (!status) return <span className="text-slate-300 text-xs">-</span>
                return (
                    <Badge variant={status === 'Target' ? 'default' : 'secondary'} className="text-[10px] shadow-sm">
                        {status}
                    </Badge>
                )
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id))
            },
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => {
                const desc = row.getValue("description") as string
                return <div className="max-w-[400px] truncate text-slate-500 text-sm font-light" title={desc}>
                    {desc || "-"}
                </div>
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const component = row.original

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onView(component)} className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50"
                                onClick={() => onDelete(component)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]
