import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateApiKey } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
    try {
        const authResult = await validateApiKey(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const organizationId = authResult.organizationId as string;

        // Fetch planned TARGET Changes for Applications and Tech Components
        const upcomingChanges = await db.projectChange.findMany({
            where: {
                project: { organizationId, status: { not: 'Completed' } },
                componentType: { in: ['Application', 'BusinessCapability', 'ITComponent'] }
            },
            include: { project: true }
        });

        // Format Payload specifically for LeanIX Integration API (GraphQL mutations)
        // Returning data shaped nicely for a leanix-integration-api run
        const leanIXPayload = upcomingChanges.map((change) => {
            return {
                type: 'FactSheet',
                id: change.operation === 'MODIFY' && change.componentData ? JSON.parse(change.componentData).externalId : undefined,
                factSheetType: change.componentType === 'Application' ? 'Application' : 'ITComponent',
                name: change.componentName,
                // LeanIX expects lifecycle changes as a structured object
                lifecycle: {
                    phase: change.operation === 'REMOVE' ? 'endOfLife' : 'active',
                    startDate: change.project.endDate ? change.project.endDate.toISOString().split('T')[0] : null
                },
                tags: [
                    { name: `ArchiMap Project: ${change.project.name}` }
                ]
            };
        });

        return NextResponse.json({
            data: leanIXPayload
        });

    } catch (error) {
        console.error('Error during LeanIX outbound sync:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
