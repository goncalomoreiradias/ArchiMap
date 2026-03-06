import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateApiKey } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate Request via M2M API Key
        const authResult = await validateApiKey(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const organizationId = authResult.organizationId as string;

        // 2. Parse Generic CMDB Payload
        // Expected payload format: { items: [{ externalId: "SYS123", name: "Billing App", layer: "Application", type: "Application", status: "Active", ... }] }
        const body = await request.json();

        if (!body || !Array.isArray(body.items)) {
            return NextResponse.json({ error: "Invalid payload format. Expected { items: [...] }" }, { status: 400 });
        }

        const items = body.items;
        let createdCount = 0;
        let updatedCount = 0;

        // 3. Process each item (Upsert based on externalId + organizationId)
        for (const item of items) {
            if (!item.externalId || !item.name) {
                console.warn("Generic CMDB Sync: Skipping item missing externalId or name", item);
                continue;
            }

            const upsertData = {
                name: item.name,
                description: item.description || '',
                layer: item.layer || 'Application',
                type: item.type || 'Application',
                status: item.status || 'Active', // CMDB items are always AS-IS
                criticality: item.criticality || 'Medium',
                lifecycle: item.lifecycle || 'Run',
                version: item.version || '1.0',
                organizationId
            };

            const existingComponent = await db.component.findUnique({
                where: {
                    organizationId_externalId: {
                        organizationId,
                        externalId: item.externalId
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

                if (!fallbackMember) {
                    throw new Error("No users found in organization to attribute component creation.");
                }

                await db.component.create({
                    data: {
                        ...upsertData,
                        externalId: item.externalId,
                        createdById: fallbackMember.userId
                    }
                });
                createdCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Generic CMDB Sync completed. Created ${createdCount}, Updated ${updatedCount}.`,
            created: createdCount,
            updated: updatedCount
        });

    } catch (error) {
        console.error('Error during generic CMDB inbound sync:', error);
        return NextResponse.json({ error: 'Internal server error during sync' }, { status: 500 });
    }
}
