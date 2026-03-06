import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateApiKey } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
    try {
        const authResult = await validateApiKey(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const organizationId = authResult.organizationId as string;

        // ServiceNow payload usually comes under "result" or as a direct array.
        // E.g.: { result: [ { sys_id: "...", name: "...", sys_class_name: "cmdb_ci_appl" } ] }
        const body = await request.json();
        const items = body.result || body.items || body;

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: "Invalid ServiceNow payload format. Expected array of objects." }, { status: 400 });
        }

        let createdCount = 0;
        let updatedCount = 0;

        for (const item of items) {
            if (!item.sys_id || (!item.name && !item.u_name)) {
                console.warn("ServiceNow Sync: Skipping item missing sys_id or name", item);
                continue;
            }

            // Map ServiceNow classes to ArchiMap Layers
            const className = item.sys_class_name?.toLowerCase() || '';
            let layer = 'Technology';
            let type = 'IT Component';

            if (className.includes('appl')) {
                layer = 'Application';
                type = 'Application';
            } else if (className.includes('server')) {
                layer = 'Technology';
                type = 'Server';
            } else if (className.includes('db') || className.includes('database')) {
                layer = 'Data';
                type = 'Database';
            }

            const upsertData = {
                name: item.name || item.u_name,
                description: item.short_description || '',
                layer,
                type,
                status: item.install_status === '7' ? 'Retired' : 'Active', // 7 is usually Retired in ServiceNow
                lifecycle: 'Run',
                organizationId
            };

            const existingComponent = await db.component.findUnique({
                where: {
                    organizationId_externalId: {
                        organizationId,
                        externalId: item.sys_id
                    }
                }
            });

            if (existingComponent) {
                await db.component.update({
                    where: { id: existingComponent.id },
                    data: upsertData
                });
                updatedCount++;
            } else {
                const fallbackMember = await db.organizationMember.findFirst({
                    where: { organizationId, role: 'OWNER' }
                }) || await db.organizationMember.findFirst({
                    where: { organizationId }
                });

                if (!fallbackMember) throw new Error("No users found in organization.");

                await db.component.create({
                    data: {
                        ...upsertData,
                        externalId: item.sys_id,
                        createdById: fallbackMember.userId
                    }
                });
                createdCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `ServiceNow Inbound Sync completed. Created ${createdCount}, Updated ${updatedCount}.`,
            created: createdCount,
            updated: updatedCount
        });

    } catch (error) {
        console.error('Error during ServiceNow inbound sync:', error);
        return NextResponse.json({ error: 'Internal server error during sync' }, { status: 500 });
    }
}
