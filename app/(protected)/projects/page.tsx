"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, FolderOpen } from "lucide-react"
import { CreateProjectModal } from "@/components/project/CreateProjectModal"

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    startDate?: string;
    endDate?: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-500 hover:bg-green-600';
            case 'In Progress': return 'bg-blue-500 hover:bg-blue-600';
            case 'Planned': return 'bg-gray-500 hover:bg-gray-600';
            case 'Draft': return 'bg-amber-500 hover:bg-amber-600';
            default: return 'bg-slate-500';
        }
    }

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Strategic Projects</h1>
                    <p className="text-gray-500 mt-1">Manage architecture transformation initiatives</p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                        <input
                            type="text"
                            placeholder="Search projects by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        New Project
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-gray-500">Loading projects...</div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <FolderOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No projects match your search</h3>
                    <p className="text-gray-500 mb-4">Try adjusting your search query</p>
                    <Button
                        onClick={() => setSearchQuery("")}
                        variant="outline"
                    >
                        Clear Search
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map(project => (
                        <Link href={`/projects/${project.id}`} key={project.id}>
                            <Card className="h-full hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-200">
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-2">
                                        <CardTitle className="text-lg leading-tight">{project.name}</CardTitle>
                                        <Badge className={getStatusColor(project.status)}>
                                            {project.status}
                                        </Badge>
                                    </div>

                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                                        {project.description || 'No description provided'}
                                    </p>
                                    <div className="flex justify-end mt-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (confirm('Are you sure you want to delete this project?')) {
                                                    try {
                                                        const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
                                                        if (res.ok) {
                                                            fetchProjects();
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                    }
                                                }
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    fetchProjects();
                }}
            />
        </div>
    )
}
