import { db } from '@/lib/db';
import { getOrgScope } from '@/lib/auth-utils';

export async function getComponentLifecycleUpdates() {
    const orgFilter = await getOrgScope();

    const roadmaps = await db.gap.findMany({
        where: {
            project: orgFilter
        },
        include: {
            changes: true,
            phases: {
                include: {
                    changes: true
                }
            }
        }
    });

    const roadmapUpdates = new Map<string, { validFrom?: Date, validTo?: Date }>();
    const createdNodes = new Map<string, any>();
    const createdEdges = new Map<string, any>();

    const processChange = (change: any, startDate?: Date | null, endDate?: Date | null) => {
        const op = change.operation?.toUpperCase();
        const compId = change.componentId;

        console.log(`Debug Change: ID=${change.id}, Op=${op}, Type='${change.componentType}', Name='${change.componentName}', Date=${startDate}`);

        // Changes are implemented when the roadmap finishes, so we use endDate as the effective starting point for new elements.
        const effectiveStartDate = endDate || startDate;

        // 1. Updates to EXISTING components
        if (op === 'ADD' && effectiveStartDate) {
            const existing = roadmapUpdates.get(compId) || {};
            if (!existing.validFrom || effectiveStartDate < new Date(existing.validFrom)) {
                existing.validFrom = effectiveStartDate;
                roadmapUpdates.set(compId, existing);
            }
        } else if (op === 'REMOVE' && endDate) {
            const existing = roadmapUpdates.get(compId) || {};
            // For REMOVE, they are validTo the endDate
            if (!existing.validTo || endDate < new Date(existing.validTo)) {
                existing.validTo = endDate;
                roadmapUpdates.set(compId, existing);
            }
        }

        // 2. NEW Components & Relationships
        if (change.componentData) { // Removed startDate check
            try {
                const data = JSON.parse(change.componentData);

                // Case A: New Component (ADD)
                // Case A: New Component (ADD)
                // Normalize type check
                const type = change.componentType?.toLowerCase() || '';
                const validTypes = ['bc', 'business capability', 'dc', 'data capability', 'abb', 'application', 'sbb', 'technology', 'solution'];

                if (op === 'ADD' && validTypes.some(t => type.includes(t))) {
                    console.log(`Debug ADD match: ${compId} with type ${type}`);
                    if (!createdNodes.has(compId)) {
                        createdNodes.set(compId, {
                            id: compId,
                            name: change.componentName || data.name || 'New Component',
                            type: change.componentType, // Keep original or map? Let's keep original for now
                            layer: data.layer || 'Business',
                            status: 'Planned',
                            validFrom: effectiveStartDate || new Date().toISOString(), // Default to now if no date, or handle as undated
                            description: change.description || data.description,
                            ...data
                        });
                    }
                }
                // Case B: New Relationship (ADD_RELATION or ADD with type relation)
                else if ((op === 'ADD_RELATION' || (op === 'ADD' && ['relation', 'relationship'].includes(change.componentType)))) {
                    console.log(`Debug Relationship Match: ${compId} - Source: ${data.sourceId}, Target: ${data.targetId}`);
                    if (data.sourceId && data.targetId && !createdEdges.has(compId)) {
                        createdEdges.set(compId, {
                            id: compId,
                            sourceComponentId: data.sourceId,
                            targetComponentId: data.targetId,
                            type: data.type || 'Association',
                            validFrom: effectiveStartDate || new Date().toISOString()
                        });
                    }
                } else {
                    console.log(`Debug UNSUPPORTED Change: ${compId}, Op=${op}, Type=${change.componentType}`);
                    // Check if it might be a relationship disguised
                    if (data.sourceId && data.targetId) {
                        console.log(`Debug POTENTIAL RELATIONSHIP missed: ${compId}`);
                    }
                }
            } catch (e) {
                console.error(`Error parsing componentData for ${compId}:`, e);
            }
        }
    };

    roadmaps.forEach((gap: any) => {
        // 1. Process Gap-level changes
        if (gap.changes && gap.changes.length > 0) {
            const gapStart = gap.startDate ? new Date(gap.startDate) : null;
            const gapEnd = gap.endDate ? new Date(gap.endDate) : null;

            gap.changes.forEach((change: any) => {
                processChange(change, gapStart, gapEnd);
            });
        }

        // 2. Process Phase-level changes
        gap.phases.forEach((phase: any) => {
            const phaseStart = phase.startDate ? new Date(phase.startDate) : null;
            const phaseEnd = phase.endDate ? new Date(phase.endDate) : null;

            // const phaseStart = phase.startDate ? new Date(phase.startDate) : null;
            // const phaseEnd = phase.endDate ? new Date(phase.endDate) : null;

            // if (!phaseStart && !phaseEnd) return; // Allow dateless phases to process changes (they might get default dates or be undated)

            phase.changes.forEach((change: any) => {
                processChange(change, phaseStart, phaseEnd);
            });
        });
    });

    return { roadmapUpdates, createdNodes, createdEdges };
}
