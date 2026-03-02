
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

async function main() {
    console.log('--- Starting Migration from JSON to SQLite ---')

    if (!fs.existsSync(DB_PATH)) {
        console.error('No db.json found!')
        return
    }

    const rawData = fs.readFileSync(DB_PATH, 'utf-8')
    const jsonDb = JSON.parse(rawData)

    // 1. Migrate Users
    console.log(`Migrating ${jsonDb.users.length} users...`)
    for (const u of jsonDb.users) {
        if (!u.username) continue

        // Check if exists
        const existing = await prisma.user.findUnique({ where: { username: u.username } })
        if (existing) {
            // Update hash if needed
            await prisma.user.update({
                where: { id: existing.id },
                data: {
                    passwordHash: u.passwordHash,
                    email: u.email,
                    role: u.role,
                    // createdBy field in User model? No.
                }
            })
        } else {
            await prisma.user.create({
                data: {
                    id: u.id, // Keep ID to maintain relations
                    username: u.username,
                    email: u.email || `${u.username}@migration.local`,
                    passwordHash: u.passwordHash || "MIGRATE_NO_PASS",
                    role: u.role || "Viewer",
                    createdAt: u.createdAt ? new Date(u.createdAt) : new Date()
                }
            })
        }
    }

    // 2. Migrate Components
    // Need to handle 'createdById' relation. Use admin if user not found.
    const admin = await prisma.user.findFirst({ where: { username: 'admin' } })
    const fallbackId = admin?.id || 'admin-id'

    console.log(`Migrating ${jsonDb.components.length} components...`)
    for (const c of jsonDb.components) {
        // Verify owner exists
        let ownerId = c.createdById
        if (!ownerId) ownerId = fallbackId

        // Check if user exists in DB, else fallback
        const ownerExists = await prisma.user.findUnique({ where: { id: ownerId } })
        if (!ownerExists) ownerId = fallbackId

        await prisma.component.upsert({
            where: { id: c.id },
            update: {
                name: c.name,
                description: c.description,
                layer: c.layer,
                type: c.type,
                status: c.status,
                criticality: c.criticality || "Medium",
                createdById: ownerId,
                updatedAt: new Date()
            },
            create: {
                id: c.id,
                name: c.name,
                description: c.description || "",
                layer: c.layer,
                type: c.type,
                status: c.status,
                criticality: c.criticality || "Medium",
                createdById: ownerId,
                createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
                updatedAt: new Date()
            }
        })
    }

    // 3. Migrate Relationships
    console.log(`Migrating ${jsonDb.relationships.length} relationships...`)
    for (const r of jsonDb.relationships) {
        // Check integrity
        const src = await prisma.component.findUnique({ where: { id: r.sourceComponentId || r.sourceId } })
        const tgt = await prisma.component.findUnique({ where: { id: r.targetComponentId || r.targetId } })

        if (src && tgt) {
            await prisma.relationship.upsert({
                where: { id: r.id },
                update: {},
                create: {
                    id: r.id,
                    sourceComponentId: src.id,
                    targetComponentId: tgt.id,
                    type: r.type,
                    description: r.description,
                    createdAt: r.createdAt ? new Date(r.createdAt) : new Date()
                }
            })
        }
    }

    // 4. Migrate Projects
    if (jsonDb.projects) {
        console.log(`Migrating ${jsonDb.projects.length} projects...`)
        for (const p of jsonDb.projects) {
            await prisma.project.upsert({
                where: { id: p.id },
                update: {
                    status: p.status,
                    currentState: p.currentState
                },
                create: {
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    status: p.status,
                    startDate: p.startDate ? new Date(p.startDate) : null,
                    endDate: p.endDate ? new Date(p.endDate) : null,
                    currentState: p.currentState || "AS-IS"
                }
            })
        }
    }

    // 5. Migrate Snapshots & Changes (Simplified: just simple inserts if parent exists)
    // ... skipping deep complexity for now, focusing on core users/components ...

    console.log('Migration Complete!')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
