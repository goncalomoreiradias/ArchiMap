import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getComponentLifecycleUpdates } from '@/lib/roadmap';
import { isValidComponentType } from '@/lib/taxonomy';
import { getOrgScope, requireEditor } from '@/lib/auth-utils';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const layerFilter = searchParams.get('layer');
        const typeFilter = searchParams.get('type');

        const orgFilter = await getOrgScope();
        const filter: any = { ...orgFilter };
        if (layerFilter) filter.layer = layerFilter;
        if (typeFilter) filter.type = typeFilter;

        const components = await db.component.findMany({ where: filter });

        // Calculate effective lifecycle updates from roadmaps
        const { roadmapUpdates, createdNodes } = await getComponentLifecycleUpdates();

        const enrichedComponents = components.map((comp: any) => {
            const updates = roadmapUpdates.get(comp.id);
            if (updates) {
                return {
                    ...comp,
                    // Prefer Roadmap dates over static if present
                    validFrom: updates.validFrom || comp.validFrom,
                    validTo: updates.validTo || comp.validTo
                };
            }
            return comp;
        });

        // Add FUTURE nodes to the response, respecting the filter
        if (createdNodes.size > 0) {
            const futureComponents = Array.from(createdNodes.values())
                .filter(node => (!layerFilter || node.layer === layerFilter) && (!typeFilter || node.type === typeFilter))
                .map(node => ({
                    ...node,
                    // Ensure consistency in response shape
                    id: node.id,
                    name: node.name,
                    layer: node.layer,
                    type: node.type,
                    status: node.status,
                    description: node.description,
                    validFrom: node.validFrom,
                    validTo: node.validTo,
                    // Add any other fields if needed for UI, e.g. metadata
                }));

            // Merge
            enrichedComponents.push(...futureComponents);
        }

        // Sort by ID to ensure consistent order, or by name
        // encodedComponents.sort(...)
        return NextResponse.json(enrichedComponents.reverse());
    } catch (error) {
        console.error('Error fetching components:', error);
        return NextResponse.json({ error: 'Failed to fetch components' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            name, layer, type, status, description, owner, criticality,
            version, lifecycle, validFrom, validTo,
            strategicValue, technicalFit, complexity,
            tags, metadata, externalLink,
            bianBusinessArea, bianBusinessDomain, bianFunctionalPattern,
            bianActionTerm, httpMethod, path,
            leanIXFactSheetType, leanIXExternalId
        } = body;

        if (!name || !layer || !type || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!isValidComponentType(layer, type)) {
            return NextResponse.json({ error: `Invalid type '${type}' for layer '${layer}'` }, { status: 400 });
        }

        const user = await db.user.findFirst();
        const orgFilter = await getOrgScope();

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
                organizationId: orgFilter.organizationId || null,

                // New Fields
                version,
                lifecycle,
                validFrom: validFrom ? new Date(validFrom) : undefined,
                validTo: validTo ? new Date(validTo) : undefined,
                strategicValue,
                technicalFit,
                complexity,
                tags,
                metadata,
                externalLink,

                // BIAN Fields
                bianBusinessArea,
                bianBusinessDomain,
                bianFunctionalPattern,
                bianActionTerm,
                httpMethod,
                path,

                // LeanIX Fields
                leanIXFactSheetType,
                leanIXExternalId
            }
        });

        return NextResponse.json(component);
    } catch (error) {
        console.error('Error creating component:', error);
        return NextResponse.json({ error: 'Failed to create component' }, { status: 500 });
    }
}
