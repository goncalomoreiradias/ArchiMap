
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const systemUser = await prisma.user.upsert({
        where: { username: 'system' },
        update: {},
        create: {
            username: 'system',
            email: 'system@enterprisearg.com',
            passwordHash: 'system', // Not used for login
            role: 'Admin'
        }
    });
    console.log('Created System User:', systemUser);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
