
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import GapBoard from "@/components/gap/GapBoard"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/jwt"

export default async function GapProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;

    // Auth check
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    let userRole = "Viewer" // Default safe

    if (token) {
        const decoded: any = verifyToken(token)
        if (decoded && typeof decoded === 'object') {
            userRole = decoded.role || "Viewer"
        }
    }

    // Fetch project to ensure it exists and get basic info
    const projectRaw = await db.project.findUnique({
        where: { id: projectId },
        include: {
            changes: true, // Fetch changes raw
            components: {
                include: {
                    component: {
                        include: { outgoingRelations: true }
                    }
                }
            }
        }
    })

    if (!projectRaw) {
        notFound()
    }

    // Manually fetch components associated with changes to populate details (especially for REMOVED items)
    // Filter out changes that are likely Relations (logic: if componentId is not found in Component table it might be a relation or invalid)
    // Actually simpler: just query all IDs, if they exist in Component table, we get them.
    const changeIds = projectRaw.changes.map(c => c.componentId)
    const referencedComponents = await db.component.findMany({
        where: { id: { in: changeIds } }
    })

    const project = {
        ...projectRaw,
        changes: projectRaw.changes.map(c => ({
            ...c,
            component: referencedComponents.find(comp => comp.id === c.componentId)
        }))
    }

    // Fetch gaps
    const gaps = await db.gap.findMany({
        where: { projectId: projectId },
        include: {
            phases: { orderBy: { startDate: 'asc' } },
            changes: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="container mx-auto py-6 h-[calc(100vh-4rem)] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{project.name} - Gap Analysis</h1>
                    <p className="text-muted-foreground text-sm">Define roadmaps for identified gaps.</p>
                </div>
                {userRole === "Viewer" && (
                    <div className="bg-yellow-50 text-yellow-800 text-xs px-3 py-1 rounded border border-yellow-200">
                        View Only Mode
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-hidden">
                <GapBoard
                    project={project}
                    initialGaps={gaps}
                    userRole={userRole}
                />
            </div>
        </div>
    )
}
