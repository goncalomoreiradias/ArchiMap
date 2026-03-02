"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const ImportResultSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    error: z.string().optional(),
})

type ImportResult = z.infer<typeof ImportResultSchema>

export async function importComponents(formData: FormData): Promise<ImportResult> {
    const file = formData.get("file") as File
    if (!file) {
        return { success: false, error: "No file provided" }
    }

    const text = await file.text()
    const rows = text.split("\n").map(row => row.split(",").map(cell => cell.trim())).filter(row => row.some(cell => cell !== ""))

    const LAYERS = ["Business", "Data", "Application", "Technology"] // Maps to BC, DC, ABB, SBB? 
    // User specified: "BC", "DC", "ABB", "SBB". 
    // Let's stick to user terms for matching, but map to DB 'layer' field.
    // Wait, user said "BC" to "SBB". I will assume standard layer mapping: 
    // BC -> Business
    // DC -> Data? Or Domain? Let's use the code "BC", "DC", "ABB", "SBB" as 'type' or 'layer' in DB?
    // Schema has 'layer' string. I will use "BC", "DC", "ABB", "SBB" as the layer values to match the horizontal swimlanes request.

    let processedCount = 0
    let errors: string[] = []

    // Create a default user reference if none exists (required by schema)
    // Ideally we should get current user. For now, let's find the first user or create a system user.
    let systemUser = await db.user.findFirst({ where: { role: "Admin" } })
    if (!systemUser) {
        systemUser = await db.user.findFirst()
    }
    if (!systemUser) {
        // Create a dummy user if absolutely no users (shouldn't happen in real app but good for safety)
        systemUser = await db.user.create({
            data: {
                username: "system_import",
                email: "system@import.local",
                passwordHash: "secure_hash",
                role: "Admin"
            }
        })
    }

    const createdById = systemUser.id

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (row.length < 4) continue // minimalist check

        // Parse row based on length
        // 4 cols: BC_Name, DC_Name, ABB_Name, SBB_Name
        // 8 cols: BC_Name, BC_Desc, DC_Name, DC_Desc, ...

        let items: { name: string; description: string; layer: string }[] = []

        if (row.length >= 8) {
            items = [
                { name: row[0], description: row[1], layer: "BC" },
                { name: row[2], description: row[3], layer: "DC" },
                { name: row[4], description: row[5], layer: "ABB" },
                { name: row[6], description: row[7], layer: "SBB" },
            ]
        } else {
            // Assume 4 columns
            items = [
                { name: row[0], description: "", layer: "BC" },
                { name: row[1], description: "", layer: "DC" },
                { name: row[2], description: "", layer: "ABB" },
                { name: row[3], description: "", layer: "SBB" },
            ]
        }

        // Process each item and link them
        let previousComponentId: string | null = null

        for (const item of items) {
            if (!item.name) continue

            // 1. Deduplication: Find or Create
            let component = await db.component.findFirst({
                where: {
                    name: item.name,
                    layer: item.layer
                }
            })

            if (!component) {
                component = await db.component.create({
                    data: {
                        name: item.name,
                        description: item.description,
                        layer: item.layer,
                        type: "Component", // Generic type
                        status: "Active",
                        criticality: "Medium",
                        createdById: createdById
                    }
                })
            } else if (item.description && component.description !== item.description) {
                // Optional: Update description if provided and different? 
                // User requirement: "Se sim, então essas já existentes ficam com novas relações"
                // Suggests we primarily care about linking. Let's keep existing description to be safe or update it.
                // Let's update it if the CSV provides a description.
                await db.component.update({
                    where: { id: component.id },
                    data: { description: item.description }
                })
            }

            // 2. Create Relation to Previous
            if (previousComponentId) {
                // Check if relation exists
                const existingRelation = await db.relationship.findFirst({
                    where: {
                        sourceComponentId: previousComponentId,
                        targetComponentId: component.id
                    }
                })

                if (!existingRelation) {
                    await db.relationship.create({
                        data: {
                            sourceComponentId: previousComponentId,
                            targetComponentId: component.id,
                            type: "Hierarchy" // or "Composition"
                        }
                    })
                }
            }

            previousComponentId = component.id
        }
        processedCount++
    }

    revalidatePath("/components")
    revalidatePath("/import")

    return { success: true, message: `Processed ${processedCount} rows successfully.` }
}
