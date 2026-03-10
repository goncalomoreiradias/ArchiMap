import { db } from "@/lib/db"
import { GapAnalysisTabs } from "@/components/gap/GapAnalysisTabs"
import { getOrgScope } from "@/lib/auth-utils"

export const dynamic = 'force-dynamic'

export default async function GapAnalysisPage() {
    // Fetch all projects scoped to organization
    const orgFilter = await getOrgScope()
    const allProjects = await db.project.findMany({ where: orgFilter })

    // Enrich with change counts
    const enrichedProjects = await Promise.all(
        allProjects.map(async (project: any) => {
            const changes = await db.projectChange.findMany({
                where: { projectId: project.id }
            })
            return {
                ...project,
                _count: {
                    changes: changes.length
                }
            }
        })
    )

    // Active Roadmaps: Projects that have completed their design phase and have gaps to analyze
    const activeProjects = enrichedProjects.filter(p => p.status === "Completed" && p._count.changes > 0)

    // Sort active by recently updated
    activeProjects.sort((a, b) => {
        const dateA = new Date(a.updatedAt || 0).getTime()
        const dateB = new Date(b.updatedAt || 0).getTime()
        return dateB - dateA
    })

    // History: Fetch actual completed roadmaps (Gaps) from completed projects that have target dates defined
    const roadmapsQuery = await db.gap.findMany({
        where: {
            endDate: { not: null },
            project: {
                status: "Completed",
                ...orgFilter
            }
        },
        include: {
            project: { select: { name: true } },
            changes: { select: { id: true } }
        }
    })

    const completedRoadmaps = roadmapsQuery
        .filter((g: any) => g.changes.length > 0)
        .map((g: any) => ({
            id: g.projectId, // Route to the project board
            name: `${g.title} - ${g.project.name}`, // Clarify it's a roadmap inside a project
            description: g.description,
            status: "Completed",
            endDate: g.endDate, // The actual user-defined target date
            _count: { changes: g.changes.length }
        }))

    // Sort completed by end date chronologically
    completedRoadmaps.sort((a, b) => {
        const dateA = new Date(a.endDate || 0).getTime()
        const dateB = new Date(b.endDate || 0).getTime()
        return dateA - dateB
    })

    return (
        <div className="container mx-auto py-8 px-6 lg:px-12 h-full flex flex-col">
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-l-4 border-indigo-500 pl-3">Gap Analysis & Roadmaps</h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl">
                        Manage architectural transformations, define implementation roadmaps, and browse historical deployments.
                    </p>
                </div>
            </div>

            <GapAnalysisTabs activeProjects={activeProjects} completedProjects={completedRoadmaps} />
        </div>
    )
}
