'use server'

import { db } from "@/lib/db"

export type ImportAnalysisResult = {
    components: {
        new: any[]
        existing: any[]
        errors: any[]
    }
    relationships: {
        new: any[]
        existing: any[]
        errors: any[]
    }
    stats: {
        totalComponents: number
        newComponents: number
        existingComponents: number
        totalRelationships: number
        newRelationships: number
        existingRelationships: number
    }
}

export async function analyzeImport(data: { components: any[], relationships: any[] }): Promise<ImportAnalysisResult> {
    const result: ImportAnalysisResult = {
        components: { new: [], existing: [], errors: [] },
        relationships: { new: [], existing: [], errors: [] },
        stats: {
            totalComponents: 0,
            newComponents: 0,
            existingComponents: 0,
            totalRelationships: 0,
            newRelationships: 0,
            existingRelationships: 0
        }
    }

    try {
        // 1. Analyze Components
        const dbComponents = await db.component.findMany();
        const componentMap = new Map(dbComponents.map(c => [c.name.trim().toLowerCase(), c]));

        for (const comp of data.components || []) {
            if (!comp.name || !comp.type || !comp.layer) {
                result.components.errors.push({ item: comp, error: "Missing required fields (name, type, layer)" });
                continue;
            }

            const existing = componentMap.get(comp.name.trim().toLowerCase());
            if (existing) {
                result.components.existing.push({ ...comp, id: existing.id, existingData: existing });
            } else {
                // Generate a temporary ID for the UI to use
                result.components.new.push({ ...comp, id: `temp-${Date.now()}-${Math.random()}` });
            }
        }

        // 2. Analyze Relationships
        // We need component IDs to check relationships. 
        // For existing ones, we have IDs. For new ones, we rely on names matching.

        const dbRelationships = await db.relationship.findMany({
            include: {
                sourceComponent: true,
                targetComponent: true
            }
        });

        // Create a quick lookup for existing relationships: "sourceName|targetName|type"
        const relationMap = new Set(
            dbRelationships.map((r: any) => `${r.sourceComponent.name.trim().toLowerCase()}|${r.targetComponent.name.trim().toLowerCase()}|${r.type.trim().toLowerCase()}`)
        );

        for (const rel of data.relationships || []) {
            if (!rel.sourceName || !rel.targetName || !rel.type) {
                result.relationships.errors.push({ item: rel, error: "Missing required fields (sourceName, targetName, type)" });
                continue;
            }

            const key = `${rel.sourceName.trim().toLowerCase()}|${rel.targetName.trim().toLowerCase()}|${rel.type.trim().toLowerCase()}`;

            if (relationMap.has(key)) {
                result.relationships.existing.push(rel);
            } else {
                result.relationships.new.push(rel);
            }
        }

        // 3. Stats
        result.stats.totalComponents = (data.components || []).length;
        result.stats.newComponents = result.components.new.length;
        result.stats.existingComponents = result.components.existing.length;

        result.stats.totalRelationships = (data.relationships || []).length;
        result.stats.newRelationships = result.relationships.new.length;
        result.stats.existingRelationships = result.relationships.existing.length;

        return result;

    } catch (error: any) {
        console.error("Analysis failed:", error);
        throw new Error(`Failed to analyze import data: ${error.message}`);
    }
}
