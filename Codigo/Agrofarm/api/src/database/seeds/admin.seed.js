import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from '../client.js'

async function seed() {
    console.log('🌱 Criando usuários...')

    const senhaAdmin = await bcrypt.hash('ADM12345', 10)
    const senhaFunc = await bcrypt.hash('FUNC12345', 10)

    const admin = await prisma.usuarios.upsert({
        where: { email: 'matheusfelipecorreasilva@hotmail.com' },
        update: {},
        create: {
            nome: 'Matheus Felipe',
            email: 'matheusfelipecorreasilva@hotmail.com',
            senha: senhaAdmin,
            role: 'ADMIN',
        },
    })

    const funcionario = await prisma.usuarios.upsert({
        where: { email: 'juliarochafiorini@gmail.com' },
        update: {},
        create: {
            nome: 'Julia Rocha',
            email: 'juliarochafiorini@gmail.com',
            senha: senhaFunc,
            role: 'FUNCIONARIO',
        },
    })

    console.log('✅ ADMIN criado:', admin.email)
    console.log('✅ FUNCIONARIO criado:', funcionario.email)
    console.log('🎉 Seed concluído!')

    await prisma.$disconnect()
}

seed().catch((e) => {
    console.error('❌ Erro no seed:', e)
    prisma.$disconnect()
    process.exit(1)
})
