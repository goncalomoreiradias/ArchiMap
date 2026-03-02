
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Creating Admin User ---')

    const username = "admin"
    const password = "admin" // Simple password for demo
    const email = "admin@example.com"

    // Check if exists
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
        console.log('Admin user already exists. Updating password...')
        const hash = await bcrypt.hash(password, 10)
        await prisma.user.update({
            where: { id: existing.id },
            data: { passwordHash: hash }
        })
        console.log('Password updated to "admin"')
        return
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
        data: {
            username,
            email,
            role: "Admin",
            passwordHash: hash
        }
    })

    console.log(`User created!`)
    console.log(`Username: ${user.username}`)
    console.log(`Password: ${password}`)
    console.log(`Role: ${user.role}`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
