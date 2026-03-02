
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const CATALOG_PATH = path.join(process.cwd(), 'data', 'catalog.json')

async function main() {
    console.log('--- Starting Catalog Migration to SQLite ---')

    if (!fs.existsSync(CATALOG_PATH)) {
        console.error('No catalog.json found!')
        return
    }

    const rawData = fs.readFileSync(CATALOG_PATH, 'utf-8')
    const catalog = JSON.parse(rawData)

    // Helper to get or create admin user
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@system.local',
            passwordHash: 'SYSTEM_ACCOUNT',
            role: 'Admin'
        }
    })

    // Helper to migrate components
    const migrateComponent = async (comp: any, type: string, layer: string) => {
        const metadata: any = {}

        // Map type-specific fields to metadata
        if (comp.domainArea) metadata.domainArea = comp.domainArea
        if (comp.bcL1) metadata.bcL1 = comp.bcL1
        if (comp.bcL2) metadata.bcL2 = comp.bcL2
        if (comp.bcL3) metadata.bcL3 = comp.bcL3
        if (comp.pattern) metadata.pattern = comp.pattern
        if (comp.domain) metadata.domain = comp.domain
        if (comp.vendor) metadata.vendor = comp.vendor
        if (comp.notes) metadata.notes = comp.notes
        if (comp.aiModality) metadata.aiModality = comp.aiModality
        if (comp.aiImpact) metadata.aiImpact = comp.aiImpact

        await prisma.component.upsert({
            where: { id: comp.id },
            update: {
                name: comp.name,
                description: comp.description || "",
                layer: layer,
                type: type,
                status: "Standard", // Default for catalog items
                criticality: "Medium",
                metadata: JSON.stringify(metadata),
                createdById: admin.id
            },
            create: {
                id: comp.id,
                name: comp.name,
                description: comp.description || "",
                layer: layer,
                type: type,
                status: "Standard",
                criticality: "Medium",
                metadata: JSON.stringify(metadata),
                createdById: admin.id
            }
        })
    }

    // 1. Migrate Business Capabilities
    console.log(`Migrating ${catalog.businessCapabilities.length} BCs...`)
    for (const bc of catalog.businessCapabilities) {
        await migrateComponent(bc, 'bc', 'Business')
    }

    // 2. Migrate Data Capabilities
    console.log(`Migrating ${catalog.dataCapabilities.length} DCs...`)
    for (const dc of catalog.dataCapabilities) {
        await migrateComponent(dc, 'dc', 'Data')
    }

    // 3. Migrate ABBs
    console.log(`Migrating ${catalog.abbs.length} ABBs...`)
    for (const abb of catalog.abbs) {
        await migrateComponent(abb, 'abb', 'Application')
    }

    // 4. Migrate SBBs
    console.log(`Migrating ${catalog.sbbs.length} SBBs...`)
    for (const sbb of catalog.sbbs) {
        await migrateComponent(sbb, 'sbb', 'Technology')
    }

    // 5. Migrate Relationships
    if (catalog.relationships) {
        console.log(`Migrating ${catalog.relationships.length} relationships...`)
        for (const r of catalog.relationships) {
            // Find IDs based on the old format (businessCapabilityId, etc.)
            const sourceId = r.sourceComponentId || r.businessCapabilityId || r.sourceId

            // Try to find target - relationships in catalog.json are often implicit/multi-hop in the JSON structure
            // But checking the actual file, they seem to be explicit connects sometimes or huge objects
            // Let's handle the specific format in catalog.json which seemed to be:
            // { businessCapabilityId, dataCapabilityId, abbId, sbbId } -> creating a chain?

            // Handle the specific format: { businessCapabilityId, dataCapabilityId, abbId, sbbId }
            // This represents a chain or a set of related components. 
            // We will create relationships between adjacent layers: BC -> DC -> ABB -> SBB

            if (r.businessCapabilityId && r.dataCapabilityId) {
                await createRel(r.businessCapabilityId, r.dataCapabilityId, 'Realization')
            }
            if (r.dataCapabilityId && r.abbId) {
                await createRel(r.dataCapabilityId, r.abbId, 'Realization')
            }
            if (r.abbId && r.sbbId) {
                await createRel(r.abbId, r.sbbId, 'Realization')
            }

            // Handle standard sourceId/targetId format if present
            if (r.sourceId && r.targetId) {
                await createRel(r.sourceId, r.targetId, r.type || 'Association')
            }
        }
    }

    console.log('Migration Complete!')
}

async function createRel(sourceId: string, targetId: string, type: string) {
    // Check existence
    const src = await prisma.component.findUnique({ where: { id: sourceId } })
    const tgt = await prisma.component.findUnique({ where: { id: targetId } })

    if (src && tgt) {
        // Simple ID generation for relation
        const relId = `REL-${sourceId}-${targetId}`

        await prisma.relationship.upsert({
            where: { id: relId },
            update: {},
            create: {
                id: relId,
                sourceComponentId: sourceId,
                targetComponentId: targetId,
                type: type,
                description: 'Standard Catalog Relationship'
            }
        })
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
