"use client"

import { useMemo, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, ArrowRight } from "lucide-react"

interface TimelineProject {
    id: string
    name: string
    description: string | null
    status: string
    endDate: Date
    _count?: {
        changes: number
    }
}

export function ImplementationHistoryTimeline({ projects }: { projects: TimelineProject[] }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return
        setIsDragging(true)
        setStartX(e.pageX - containerRef.current.offsetLeft)
        setScrollLeft(containerRef.current.scrollLeft)
    }

    const handleMouseLeave = () => {
        setIsDragging(false)
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return
        e.preventDefault()
        const x = e.pageX - containerRef.current.offsetLeft
        const walk = (x - startX) * 1.5 // Scroll speed
        containerRef.current.scrollLeft = scrollLeft - walk
    }

    // Calculate dynamic width based on number of projects (e.g., 400px per project + padding)
    const timelineWidth = Math.max(1200, projects.length * 400 + 400)

    // Group projects by Year and Month for the background track
    const uniqueMonths = useMemo(() => {
        if (projects.length === 0) return []

        const start = new Date(projects[0].endDate)
        const end = new Date(projects[projects.length - 1].endDate)

        // Add some padding months
        start.setMonth(start.getMonth() - 1)
        end.setMonth(end.getMonth() + 2)

        const months = []
        let current = new Date(start)
        while (current <= end) {
            months.push(new Date(current))
            current.setMonth(current.getMonth() + 1)
        }
        return months
    }, [projects])

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground border rounded-lg border-dashed m-8">
                <CalendarDays className="w-12 h-12 mb-4 text-gray-300" />
                <p>No completed roadmaps or implementation history found.</p>
                <p className="text-sm mt-2">Projects marked as "Completed" with an End Date will appear here.</p>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`relative w-full h-[calc(100vh-12rem)] overflow-x-auto overflow-y-hidden scrollbar-none transition-cursor duration-150 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
            <div
                className="relative h-full flex items-center"
                style={{ width: `${timelineWidth}px` }}
            >
                {/* 1. Main Horizontal Track */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-indigo-300 to-purple-200 top-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(99,102,241,0.2)] rounded-full" />

                {/* 2. Background Month/Year Ticks */}
                <div className="absolute inset-0 flex items-center justify-between px-20 opacity-30 pointer-events-none">
                    {uniqueMonths.map((date, i) => (
                        <div key={i} className="flex flex-col items-center relative" style={{ left: `${(i / Math.max(1, uniqueMonths.length - 1)) * 100}%`, position: 'absolute' }}>
                            <div className="h-8 w-px bg-slate-400 absolute top-1/2 -translate-y-1/2" />
                            <span className="absolute top-8 font-mono text-xs font-bold text-slate-500">
                                {date.toLocaleString('default', { month: 'short' }).toUpperCase()}
                            </span>
                            {date.getMonth() === 0 && (
                                <span className="absolute -top-8 font-mono text-sm font-black text-slate-700">
                                    {date.getFullYear()}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* 3. Project Nodes */}
                <div className="absolute inset-x-20 inset-y-0 text-white">
                    {projects.map((project, index) => {
                        const isTop = index % 2 === 0
                        // Distribute evenly across the width
                        const leftPercentage = (index / Math.max(1, projects.length - 1)) * 100

                        return (
                            <motion.div
                                key={project.id}
                                className="absolute flex flex-col items-center"
                                style={{
                                    left: `${leftPercentage}%`,
                                    [isTop ? 'bottom' : 'top']: '50%',
                                }}
                                initial={{ opacity: 0, scale: 0.9, y: isTop ? 20 : -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.15, type: 'spring' }}
                            >
                                {/* Stem linking to the main track */}
                                <div
                                    className={`w-0.5 bg-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.4)] ${isTop ? 'h-16 mb-2 mt-auto' : 'h-16 mt-2 mb-auto'}`}
                                    style={{ order: isTop ? 2 : 0 }}
                                />

                                {/* Connection Dot */}
                                <div className="absolute w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-md z-10" style={{ [isTop ? 'bottom' : 'top']: '-6px' }} />

                                {/* Project Card */}
                                <a
                                    href={`/gap-analysis/${project.id}`}
                                    className="block group z-20"
                                    style={{ order: 1 }}
                                    draggable={false}
                                    onClick={(e) => {
                                        // Ignore clicks if the user was just dragging
                                        if (isDragging) e.preventDefault()
                                    }}
                                >
                                    <Card className={`w-80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 cursor-pointer ${isTop ? 'mb-4' : 'mt-4'} group-hover:border-indigo-400 bg-white/90 backdrop-blur-sm`}>
                                        <CardHeader className="pb-3 pt-4 px-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1.5 font-mono text-[10px]" suppressHydrationWarning>
                                                    <CalendarDays className="w-3 h-3" />
                                                    {new Date(project.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                                                {project.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="px-4 pb-4">
                                            <CardDescription className="line-clamp-2 text-xs mb-4 min-h-[2rem]">
                                                {project.description || "No description provided."}
                                            </CardDescription>

                                            <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
                                                <div className="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
                                                    <span>Architecture Impact</span>
                                                    <span className="text-indigo-600">{project._count?.changes || 0} Components</span>
                                                </div>
                                                <Progress value={Math.min(100, ((project._count?.changes || 0) * 10))} className="h-1.5 bg-slate-200" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </a>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
