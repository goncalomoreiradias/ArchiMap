"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Search } from "lucide-react"

export function GapProjectList({ projects }: { projects: any[] }) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex items-center gap-4 w-full sm:w-96">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search gap analysis projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
            </div>

            {/* Empty States */}
            {projects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                    No projects with identified gaps found. Create project changes to start analysis.
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No projects match your search</h3>
                    <p className="text-gray-500 mb-4">Try adjusting your search query</p>
                    <button
                        onClick={() => setSearchQuery("")}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                        Clear Search
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => (
                        <a href={`/gap-analysis/${project.id}`} key={project.id} className="block group">
                            <Card className="hover:shadow-md transition-shadow h-full cursor-pointer group-hover:border-primary/50">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{project.name}</CardTitle>
                                        <Badge variant={project.status === "Completed" ? "secondary" : "outline"}
                                            className={project.status === "Completed" ? "bg-green-100 text-green-800" : ""}>
                                            {project.status}
                                        </Badge>
                                    </div>
                                    <CardDescription className="line-clamp-2 min-h-[2.5em]">
                                        {project.description || "No description provided."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm text-muted-foreground border-t pt-3">
                                            <span>Transition Timeline</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <span className="bg-slate-100 px-2 py-1 rounded text-slate-700">AS-IS</span>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            <span className="bg-blue-100 px-2 py-1 rounded text-blue-700">TARGET</span>
                                        </div>

                                        <div className="space-y-1 pt-2">
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Impact</span>
                                                <span>{project._count?.changes || 0} Changes</span>
                                            </div>
                                            <Progress value={Math.min(100, ((project._count?.changes || 0) > 0 ? 50 : 0))} className="h-2" />
                                        </div>

                                        <div className="pt-2 flex items-center justify-end text-xs text-muted-foreground" suppressHydrationWarning>
                                            {project.endDate ? `Target: ${new Date(project.endDate).toLocaleDateString()}` : "Target date unset"}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}
