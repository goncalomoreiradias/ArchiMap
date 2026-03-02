
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log(`\n--- Checking for ANY metadata ---`)
    const withMeta = await prisma.component.findFirst({
        where: {
            metadata: { not: null } // Prisma might handle JSON null differently, strict check
        }
    })

    if (withMeta) {
        console.log(`Found component with metadata: ${withMeta.name}`)
        console.log(withMeta.metadata)
    } else {
        console.log('NO components with metadata found.')
        // Check raw query
        const all = await prisma.component.findMany({ take: 5 })
        console.log('Sample raw:', all.map(c => ({ name: c.name, meta: c.metadata })))
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
