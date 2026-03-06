import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateApiKey } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
    try {
        // 1. Authenticate Request via M2M API Key
        const authResult = await validateApiKey(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const organizationId = authResult.organizationId as string;

        // 2. Fetch all Planned TARGET Changes
        // We look for any Project in the organization that is not "Completed"
        // and fetch the changes involving computing components (applications, servers).
        const upcomingChanges = await db.projectChange.findMany({
            where: {
                project: {
                    organizationId: organizationId,
                    status: { not: 'Completed' }
                },
                componentType: {
                    in: ['Application', 'Technology', 'abb', 'sbb', 'ITComponent', 'BusinessCapability']
                }
            },
            include: {
                project: { select: { name: true, status: true, endDate: true } },
                gap: { select: { title: true } }
            },
            orderBy: { project: { endDate: 'asc' } }
        });

        // 3. Format Payload for Generic CMDB
        const payload = upcomingChanges.map((change) => {
            // Attempt to parse draft attributes if they exist
            let parsedData = {};
            if (change.componentData) {
                try { parsedData = JSON.parse(change.componentData); } catch (e) { }
            }

            return {
                changeId: change.id,
                operation: change.operation, // 'ADD', 'MODIFY', 'REMOVE'
                componentName: change.componentName,
                componentType: change.componentType,
                draftAttributes: parsedData,
                context: {
                    projectName: change.project.name,
                    targetDate: change.project.endDate || null,
                    projectStatus: change.project.status,
                    gapTitle: change.gap?.title || null
                },
                lastUpdated: change.updatedAt
            };
        });

        return NextResponse.json({
            organizationId,
            totalPlannedChanges: payload.length,
            targets: payload
        });

    } catch (error) {
        console.error('Error during generic CMDB outbound sync:', error);
        return NextResponse.json({ error: 'Internal server error during target export' }, { status: 500 });
    }
}
