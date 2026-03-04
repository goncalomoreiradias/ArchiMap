"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GapProjectList } from "./GapProjectList"
import { ImplementationHistoryTimeline } from "@/components/history/ImplementationHistoryTimeline"
import { Layers, History } from "lucide-react"

export function GapAnalysisTabs({ activeProjects, completedProjects }: { activeProjects: any[], completedProjects: any[] }) {
    return (
        <Tabs defaultValue="active" className="w-full" id="gap-analysis-tabs">
            <div className="flex justify-between items-center mb-8">
                <TabsList className="bg-slate-100/50 p-1">
                    <TabsTrigger value="active" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Layers className="w-4 h-4" />
                        Active Roadmaps
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <History className="w-4 h-4" />
                        Implementation Repository
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="active" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <GapProjectList projects={activeProjects} />
            </TabsContent>

            <TabsContent value="history" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <ImplementationHistoryTimeline projects={completedProjects} />
            </TabsContent>
        </Tabs>
    )
}
