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

        // LeanIX payload (e.g., from Webhooks or GraphQL sync exports)
        // Usually contains an array of FactSheets or a single event webhook.
        const body = await request.json();

        // Handle both bulk arrays and single webhook events
        const items = Array.isArray(body) ? body : (body.factSheets ? body.factSheets : [body]);

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Invalid LeanIX payload format." }, { status: 400 });
        }

        let createdCount = 0;
        let updatedCount = 0;

        for (const item of items) {
            // LeanIX typical structure: { id: "uuid", name: "...", type: "Application" }
            const factSheet = item.factSheet || item; // Unbox if it's an event payload

            if (!factSheet.id || !factSheet.name) {
                console.warn("LeanIX Sync: Skipping FactSheet missing id or name", factSheet);
                continue;
            }

            // Map LeanIX FactSheet Types to ArchiMap Layers
            const fsType = factSheet.type || 'Application';
            let layer = 'Application';

            if (fsType === 'Application') layer = 'Application';
            else if (fsType === 'ITComponent') layer = 'Technology';
            else if (fsType === 'BusinessCapability') layer = 'Business';
            else if (fsType === 'DataObject') layer = 'Data';

            const upsertData = {
                name: factSheet.name,
                description: factSheet.description || '',
                layer,
                type: fsType,
                status: factSheet.status || 'Active', // Defaults to Active AS-IS component
                lifecycle: factSheet.lifecycle?.phase || 'Run',
                leanIXFactSheetType: fsType,
                organizationId
            };

            const existingComponent = await db.component.findUnique({
                where: {
                    organizationId_externalId: {
                        organizationId,
                        externalId: factSheet.id
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
                        externalId: factSheet.id,
                        createdById: fallbackMember.userId
                    }
                });
                createdCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `LeanIX Inbound Sync completed. Created ${createdCount}, Updated ${updatedCount}.`,
            created: createdCount,
            updated: updatedCount
        });

    } catch (error) {
        console.error('Error during LeanIX inbound sync:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
