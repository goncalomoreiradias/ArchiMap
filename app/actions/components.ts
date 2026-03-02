"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type DeleteResult = {
    success: boolean
    message?: string
    dependencies?: {
        name: string
        type: string
        id: string
        relationType: string
    }[]
}

export async function updateComponent(id: string, data: {
    name?: string
    description?: string
    lifecycle?: string
    version?: string
    validFrom?: Date | string | null
    validTo?: Date | string | null
    strategicValue?: string
    technicalFit?: string
    complexity?: string
    tags?: string
    metadata?: string
    externalLink?: string
    status?: string
}): Promise<{ success: boolean, error?: any }> {
    try {
        await db.component.update({
            where: { id },
            data: {
                ...data
            }
        })
        revalidatePath("/components")
        return { success: true }
    } catch (error) {
        console.error("Update Error:", error)
        return { success: false, error }
    }
}

export async function deleteComponent(componentId: string, force: boolean = false): Promise<DeleteResult> {
    try {
        // 1. Check if component exists (only in DB)
        const component = await db.component.findUnique({
            where: { id: componentId }
        })

        if (!component) {
            // If not in DB, it might be a catalog component which we cannot delete
            return { success: false, message: "Cannot delete Catalog components (Read-only)" }
        }

        // 2. Check dependencies (Relationships)
        // Find relations where this component is source OR target
        const allRelations = await db.relationship.findMany({
            where: {
                OR: [
                    { sourceComponentId: componentId },
                    { targetComponentId: componentId }
                ]
            }
        })

        if (allRelations.length > 0) {
            if (!force) {
                // Return warning with dependencies
                // We need to fetch details for the UI
                // For simplicity, we just return the count or basic info now, but the UI expects details.
                // Let's try to resolve names.

                // Helper to get name
                const getName = async (id: string) => {
                    const c = await db.component.findUnique({ where: { id } })
                    if (c) return { name: c.name, type: c.layer }
                    // If not in DB, check catalog (basic fallback)
                    // optimization: we assume if not in DB it's catalog, but we don't have catalog loaded here easily without file IO.
                    // we can just return ID or "Catalog Item"
                    return { name: "External/Catalog Component", type: "Unknown" }
                }

                const dependencies = await Promise.all(allRelations.map(async (r: any) => {
                    const isSource = r.sourceComponentId === componentId
                    const otherId = isSource ? r.targetComponentId : r.sourceComponentId
                    const info = await getName(otherId)
                    return {
                        name: info.name,
                        type: info.type,
                        id: otherId,
                        relationType: r.type || (isSource ? "Outgoing" : "Incoming")
                    }
                }))

                return {
                    success: false,
                    message: "Component has existing relationships",
                    dependencies: dependencies
                }
            } else {
                // FORCE DELETE: Delete all relationships first
                await db.relationship.deleteMany({
                    where: {
                        OR: [
                            { sourceComponentId: componentId },
                            { targetComponentId: componentId }
                        ]
                    }
                })
            }
        }

        // 3. Delete Component
        await db.component.delete({
            where: { id: componentId }
        })

        revalidatePath("/components")
        revalidatePath("/mind-map")

        return { success: true }
    } catch (error) {
        console.error("Delete Error:", error)
        return { success: false, message: "Failed to delete component" }
    }
}
