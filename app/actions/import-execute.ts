'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache";

export async function executeImport(data: { components: any[], relationships: any[] }) {
    try {
        const results = await db.$transaction(async (tx) => {
            const createdComponents = [];
            const createdRelationships = [];
            const user = await tx.user.findFirst();

            // 1. Create Components
            // We need to map Name -> ID to creating relationships later
            const nameToIdMap = new Map<string, string>();

            // First, get all existing IDs to populate the map
            const existing = await tx.component.findMany({ select: { id: true, name: true } });
            existing.forEach(c => nameToIdMap.set(c.name.trim().toLowerCase(), c.id));

            for (const comp of data.components) {
                const normalizedName = comp.name.trim().toLowerCase();

                // Double check if it exists (in case of race conditions, though unlikely in this context)
                if (nameToIdMap.has(normalizedName)) {
                    continue; // Skip existing
                }

                const newComp = await tx.component.create({
                    data: {
                        name: comp.name.trim(), // Clean the name on save
                        layer: comp.layer,
                        type: comp.type,
                        status: comp.status || 'AS-IS',
                        description: comp.description,
                        version: comp.version,
                        lifecycle: comp.lifecycle,
                        strategicValue: comp.strategicValue,
                        technicalFit: comp.technicalFit,
                        complexity: comp.complexity,
                        tags: comp.tags,
                        metadata: comp.metadata,
                        externalLink: comp.externalLink,
                        criticality: 'Medium', // Default
                        createdById: user?.id || 'admin-id',
                        owner: comp.owner || null,
                        validFrom: comp.validFrom ? new Date(comp.validFrom) : null,
                        validTo: comp.validTo ? new Date(comp.validTo) : null
                    }
                });

                createdComponents.push(newComp);
                nameToIdMap.set(normalizedName, newComp.id);
            }

            // 2. Create Relationships
            for (const rel of data.relationships) {
                const sourceId = nameToIdMap.get(rel.sourceName.trim().toLowerCase());
                const targetId = nameToIdMap.get(rel.targetName.trim().toLowerCase());

                if (!sourceId || !targetId) {
                    // Skip if we can't resolve items
                    console.warn(`Skipping relationship: "${rel.sourceName}" -> "${rel.targetName}" (Components not found). Map keys available: ${nameToIdMap.size}`);
                    continue;
                }

                // Check existence
                const existingRel = await tx.relationship.findFirst({
                    where: {
                        sourceComponentId: sourceId,
                        targetComponentId: targetId,
                        type: rel.type
                    }
                });

                if (!existingRel) {
                    const newRel = await tx.relationship.create({
                        data: {
                            sourceComponentId: sourceId,
                            targetComponentId: targetId,
                            type: rel.type,
                            description: rel.description
                        }
                    });
                    createdRelationships.push(newRel);
                }
            }

            return {
                components: createdComponents.length,
                relationships: createdRelationships.length
            };
        }, {
            maxWait: 10000, // default: 2000
            timeout: 60000  // default: 5000 (increased to 60s for large imports)
        });

        revalidatePath('/components');
        revalidatePath('/mind-map');

        return { success: true, count: results };

    } catch (error: any) {
        console.error("Import execution failed:", error);
        return { success: false, error: error?.message || "Failed to execute import" };
    }
}
