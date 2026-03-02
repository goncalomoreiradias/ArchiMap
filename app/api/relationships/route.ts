import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

import { getComponentLifecycleUpdates } from '@/lib/roadmap';

export async function GET() {
    try {
        const relationships = await db.relationship.findMany();

        // Fetch future relationships
        const { createdEdges } = await getComponentLifecycleUpdates();

        // Map existing relationships to ensure sourceId/targetId exist
        const mappedExisting = relationships.map(r => ({
            ...r,
            sourceId: r.sourceComponentId,
            targetId: r.targetComponentId
        }));

        const futureEdges = Array.from(createdEdges.values()).map(edge => ({
            id: edge.id,
            sourceComponentId: edge.sourceComponentId,
            targetComponentId: edge.targetComponentId,
            type: edge.type,
            description: edge.description,
            // Map to match Relationship model if needed
            // Use explicit mapping to avoid issues
            sourceId: edge.sourceComponentId, // For compatibility if UI uses sourceId
            targetId: edge.targetComponentId
        }));

        // Merge
        const allRelationships = [...mappedExisting, ...futureEdges];

        return NextResponse.json(allRelationships);
    } catch (error) {
        console.error('Error fetching relationships:', error);
        return NextResponse.json({ error: 'Failed to fetch relationships' }, { status: 500 });
    }
}
