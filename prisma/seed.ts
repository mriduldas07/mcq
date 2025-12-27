import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Create a default teacher
    const teacher = await prisma.user.upsert({
        where: { email: 'teacher@example.com' },
        update: {},
        create: {
            email: 'teacher@example.com',
            name: 'Demo Teacher',
            planType: 'FREE',
            credits: 5,
        },
    })

    console.log({ teacher })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
