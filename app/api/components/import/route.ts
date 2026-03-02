import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Input must be an array of components' }, { status: 400 });
        }

        const createdComponents = [];
        const errors = [];
        const user = await db.user.findFirst(); // Default user for now

        for (const item of body) {
            try {
                const {
                    name, layer, type, status, description, owner, criticality,
                    version, lifecycle, validFrom, validTo,
                    strategicValue, technicalFit, complexity,
                    tags, metadata, externalLink
                } = item;

                if (!name || !layer || !type || !status) {
                    errors.push({ item: item.name || 'Unknown', error: 'Missing required fields' });
                    continue;
                }

                const component = await db.component.create({
                    data: {
                        name,
                        layer,
                        type,
                        status,
                        description,
                        owner,
                        criticality: criticality || 'Medium',
                        createdById: user?.id || 'admin-id',

                        version,
                        lifecycle,
                        validFrom: validFrom ? new Date(validFrom) : undefined,
                        validTo: validTo ? new Date(validTo) : undefined,
                        strategicValue,
                        technicalFit,
                        complexity,
                        tags,
                        metadata,
                        externalLink
                    }
                });
                createdComponents.push(component);
            } catch (err: any) {
                console.error(`Failed to create component ${item.name}:`, err);
                errors.push({ item: item.name, error: err.message });
            }
        }

        return NextResponse.json({
            message: `Processed ${body.length} items`,
            successCount: createdComponents.length,
            created: createdComponents,
            errors: errors
        });
    } catch (error) {
        console.error('Error processing import:', error);
        return NextResponse.json({ error: 'Failed to process import' }, { status: 500 });
    }
}
