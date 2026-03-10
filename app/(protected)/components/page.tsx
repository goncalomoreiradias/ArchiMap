import { db } from "@/lib/db"
import { ComponentsView } from "@/components/ComponentsView"
import { getOrgScope } from "@/lib/auth-utils"

const LAYERS = ["Business", "BIAN", "Application", "Data", "Technology"] as const

export default async function ComponentsPage() {
    // 1. Fetch DB Components scoped to organization
    const orgFilter = await getOrgScope()
    const dbComponents = await db.component.findMany({
        where: orgFilter,
        orderBy: { name: 'asc' }
    });

    // 2. Map to View Format
    const allComponents = dbComponents.map((comp) => {
        // Normalize layer for the view (BC, DC, ABB, SBB)
        // The layer saved in DB now reflects our exact 5-layer vocabulary
        let viewLayer = comp.layer || 'Business'; // Default empty fallback

        // Parse metadata if needed or pass as is? 
        // The view probably expects a flat object or uses metadata directly.
        // Let's pass it as is for now, matching the previous "Merge DB Items" logic.

        return {
            id: comp.id,
            name: comp.name,
            description: comp.description,
            layer: viewLayer, // formatted for grouping
            originalLayer: comp.layer,
            type: comp.type,
            status: comp.status,

            // Standard Fields
            version: comp.version,
            lifecycle: comp.lifecycle,
            validFrom: comp.validFrom,
            validTo: comp.validTo,
            strategicValue: comp.strategicValue,
            technicalFit: comp.technicalFit,
            complexity: comp.complexity,
            tags: comp.tags,
            metadata: comp.metadata,
            externalLink: comp.externalLink
        };
    });

    // Group by Layer
    const groupedComponents = LAYERS.reduce((acc, layer) => {
        acc[layer] = allComponents.filter(c => c.layer === layer)
        return acc
    }, {} as Record<string, any[]>)

    return <ComponentsView groupedComponents={groupedComponents} />
}
