import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { getComponentLifecycleUpdates } from '@/lib/roadmap';

export async function GET() {
    try {
        // 1. Fetch DB Components & Relationships
        const [components, relationships] = await Promise.all([
            db.component.findMany(),
            db.relationship.findMany()
        ]);

        // 2. Initialize Catalog Structure
        const catalogData = {
            businessCapabilities: [] as any[],
            dataCapabilities: [] as any[],
            abbs: [] as any[],
            sbbs: [] as any[],
            bians: [] as any[],
            relationships: [] as any[]
        };

        // 3. Populate Components
        components.forEach((comp) => {
            const type = comp.type.toLowerCase();
            let metadata: any = {};
            try {
                if (comp.metadata) {
                    metadata = JSON.parse(comp.metadata);
                }
            } catch (e) {
                console.warn(`Failed to parse metadata for component ${comp.id}`);
            }

            const compData = {
                id: comp.id,
                name: comp.name,
                description: comp.description,
                layer: comp.layer,
                type: comp.type,
                status: comp.status,
                criticality: comp.criticality,

                // Restore Metadata Fields
                domainArea: metadata.domainArea,
                bcL1: metadata.bcL1,
                bcL2: metadata.bcL2,
                bcL3: metadata.bcL3,
                pattern: metadata.pattern,
                domain: metadata.domain,
                vendor: metadata.vendor,
                notes: metadata.notes,
                aiModality: metadata.aiModality,
                aiImpact: metadata.aiImpact,

                // New Fields
                version: comp.version,
                lifecycle: comp.lifecycle,
                strategicValue: comp.strategicValue,
                technicalFit: comp.technicalFit,
                tags: comp.tags,
                metadata: comp.metadata,
                link: comp.externalLink
            };

            if (type === 'bc' || comp.layer === 'Business') {
                catalogData.businessCapabilities.push(compData);
            } else if (comp.layer === 'BIAN') {
                catalogData.bians.push(compData);
            } else if (type === 'dc' || comp.layer === 'Data') {
                catalogData.dataCapabilities.push(compData);
            } else if (type === 'abb' || comp.layer === 'Application') {
                catalogData.abbs.push(compData);
            } else if (type === 'sbb' || comp.layer === 'Technology') {
                catalogData.sbbs.push(compData);
            }
        });

        // 3.5 Populate Future Components from Roadmap
        // Calculate effective lifecycle updates from roadmaps
        const { createdNodes, createdEdges } = await getComponentLifecycleUpdates();

        createdNodes.forEach((node) => {
            // Determine structure similar to DB components
            const type = node.type.toLowerCase();
            const futureComp = {
                id: node.id,
                name: node.name,
                description: node.description,
                layer: node.layer,
                type: node.type,
                status: node.status,
                // Add default or computed values for fields not in roadmap
                criticality: 'Medium', // Default
                version: '1.0',
                lifecycle: 'Plan',
                strategicValue: 3,
                technicalFit: 3,
                tags: [],
                metadata: node.metadata,
                // Important: Ensure date fields are present
                validFrom: node.validFrom,
                validTo: node.validTo,
                isFuture: true
            };

            if (['bc', 'business capability'].some(t => type.includes(t)) || node.layer === 'Business') {
                catalogData.businessCapabilities.push(futureComp);
            } else if (node.layer === 'BIAN') {
                catalogData.bians.push(futureComp);
            } else if (['dc', 'data capability'].some(t => type.includes(t)) || node.layer === 'Data') {
                catalogData.dataCapabilities.push(futureComp);
            } else if (['abb', 'application'].some(t => type.includes(t)) || node.layer === 'Application') {
                catalogData.abbs.push(futureComp);
            } else if (['sbb', 'technology'].some(t => type.includes(t)) || node.layer === 'Technology') {
                catalogData.sbbs.push(futureComp);
            }
        });

        // 4. Populate Relationships
        catalogData.relationships = relationships.map(r => ({
            id: r.id,
            sourceId: r.sourceComponentId,
            targetId: r.targetComponentId,
            type: r.type,
            description: r.description
        }));

        // Add Future Relationships
        createdEdges.forEach((edge) => {
            catalogData.relationships.push({
                id: edge.id,
                sourceId: edge.sourceComponentId,
                targetId: edge.targetComponentId,
                type: edge.type,
                description: 'Planned Relationship',
                validFrom: edge.validFrom,
                isFuture: true
            });
        });

        return NextResponse.json(catalogData);
    } catch (error) {
        console.error('Error loading catalog:', error);
        return NextResponse.json(
            { error: 'Failed to load catalog' },
            { status: 500 }
        );
    }
}
