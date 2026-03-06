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

        // Fetch planned TARGET Changes for Applications/Servers
        const upcomingChanges = await db.projectChange.findMany({
            where: {
                project: { organizationId, status: { not: 'Completed' } },
                componentType: { in: ['Application', 'Technology', 'Server', 'Database'] }
            },
            include: { project: true }
        });

        // Format Payload specifically for ServiceNow Import Set API (sys_import_set)
        const serviceNowPayload = upcomingChanges.map((change) => {
            return {
                u_archimap_change_id: change.id,
                u_operation: change.operation, // ADD, MODIFY, REMOVE
                u_ci_name: change.componentName,
                u_ci_class: change.componentType === 'Application' ? 'cmdb_ci_appl' : 'cmdb_ci_server',
                u_project_name: change.project.name,
                u_planned_date: change.project.endDate ? change.project.endDate.toISOString().split('T')[0] : ''
            };
        });

        // The ServiceNow Table API typically receives arrays in bulk inserts or one-by-one.
        // Returning as a structured generic JSON list for their ingest engine (e.g., flow designer).
        return NextResponse.json({
            result: serviceNowPayload
        });

    } catch (error) {
        console.error('Error during ServiceNow outbound sync:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
