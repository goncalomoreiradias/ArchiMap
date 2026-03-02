
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Debugging Auth ---')

    // 1. Test Hashing independently
    console.log('\n1. Testing bcrypjs directly:')
    const password = "password123"
    const hash = await bcrypt.hash(password, 10)
    console.log(`Password: ${password}`)
    console.log(`Hash: ${hash}`)
    const match = await bcrypt.compare(password, hash)
    console.log(`Compare Match: ${match}`)

    // 2. List Users
    console.log('\n2. Listing Users from DB:')
    const users = await prisma.user.findMany()

    if (users.length === 0) {
        console.log('No users found.')
    }

    for (const user of users) {
        console.log(`- User: ${user.username} (ID: ${user.id})`)
        console.log(`  Email: ${user.email}`)
        console.log(`  Role: ${user.role}`)
        console.log(`  PasswordHash: ${user.passwordHash ? user.passwordHash.substring(0, 20) + '...' : 'NULL'}`)

        // Attempt to compare with default password
        const isDefault = await bcrypt.compare("123456", user.passwordHash)
        console.log(`  Matches "123456"?: ${isDefault}`)

        // Attempt to compare with "admin"
        const isAdminPass = await bcrypt.compare("admin", user.passwordHash)
        console.log(`  Matches "admin"?: ${isAdminPass}`)
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
