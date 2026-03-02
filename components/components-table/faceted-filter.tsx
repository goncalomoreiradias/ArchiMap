"use client"

import * as React from "react"
import { CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons"
import { Column } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DataTableFacetedFilterProps<TData, TValue> {
    column?: Column<TData, TValue>
    title?: string
    options: {
        label: string
        value: string
        icon?: React.ComponentType<{ className?: string }>
    }[]
}

export function DataTableFacetedFilter<TData, TValue>({
    column,
    title,
    options,
}: DataTableFacetedFilterProps<TData, TValue>) {
    const facets = column?.getFacetedUniqueValues()
    // Ensure we work with a Set even if filter value is undefined
    const filterValue = column?.getFilterValue() as string[]
    const selectedValues = new Set(filterValue || [])

    const handleSelect = (value: string, checked: boolean) => {
        const newSelected = new Set(selectedValues)
        if (checked) {
            newSelected.add(value)
        } else {
            newSelected.delete(value)
        }
        const filterValues = Array.from(newSelected)
        column?.setFilterValue(
            filterValues.length ? filterValues : undefined
        )
    }

    const handleClear = () => {
        column?.setFilterValue(undefined)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed">
                    <PlusCircledIcon className="mr-2 h-4 w-4" />
                    {title}
                    {selectedValues?.size > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {selectedValues.size}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selectedValues.size > 2 ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {selectedValues.size} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) => selectedValues.has(option.value))
                                        .map((option) => (
                                            <Badge
                                                variant="secondary"
                                                key={option.value}
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="start">
                <div className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Filter by {title}
                    </div>
                    <ScrollArea className="h-[250px] pr-2">
                        {options.map((option) => {
                            const isSelected = selectedValues.has(option.value)
                            return (
                                <div
                                    key={option.value}
                                    className="flex items-center space-x-2 px-2 py-1.5 rounded-sm hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                    onClick={() => handleSelect(option.value, !isSelected)}
                                >
                                    <Checkbox
                                        id={`filter-${title}-${option.value}`}
                                        checked={isSelected}
                                        onCheckedChange={(checked) => handleSelect(option.value, checked as boolean)}
                                        className="pointer-events-none" // Let parent div handle click
                                    />
                                    <div className="flex-1 flex items-center text-sm font-medium">
                                        {option.icon && (
                                            <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span>{option.label}</span>
                                    </div>
                                    {facets?.get(option.value) && (
                                        <span className="flex h-4 w-4 items-center justify-center font-mono text-xs text-muted-foreground">
                                            {facets.get(option.value)}
                                        </span>
                                    )}
                                </div>
                            )
                        })}
                    </ScrollArea>

                    {selectedValues.size > 0 && (
                        <>
                            <Separator className="my-2" />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-8 font-normal text-xs"
                                onClick={handleClear}
                            >
                                Clear filters
                            </Button>
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
