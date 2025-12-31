import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Create a default teacher with password: "password123"
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const teacher = await prisma.user.upsert({
        where: { email: 'teacher@example.com' },
        update: {
            passwordHash: hashedPassword,
        },
        create: {
            email: 'teacher@example.com',
            name: 'Demo Teacher',
            passwordHash: hashedPassword,
            planType: 'FREE',
            credits: 5,
        },
    })

    console.log({ teacher })
    console.log('\n✅ Seed complete!')
    console.log('📧 Email: teacher@example.com')
    console.log('🔑 Password: password123')
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
