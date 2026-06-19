import 'dotenv/config'
import prisma from '../client.js'

async function seed() {
    console.log('🌱 Criando culturas...')

    const culturas = [
        { nome: 'Soja', cor: '#8B4513' },
        { nome: 'Milho', cor: '#FFD700' },
        { nome: 'Café', cor: '#6F4E37' },
        { nome: 'Trigo', cor: '#F5DEB3' },
        { nome: 'Arroz', cor: '#F0E68C' },
        { nome: 'Feijão', cor: '#8B0000' },
        { nome: 'Algodão', cor: '#F5F5DC' },
        { nome: 'Cana-de-açúcar', cor: '#90EE90' },
    ]

    for (const cultura of culturas) {
        const created = await prisma.culturas.upsert({
            where: { nome: cultura.nome },
            update: {},
            create: cultura,
        })
        console.log(`✅ Cultura criada: ${created.nome} (${created.cor})`)
    }

    console.log('🎉 Seed de culturas concluído!')
    await prisma.$disconnect()
}

seed().catch((e) => {
    console.error('❌ Erro no seed:', e)
    prisma.$disconnect()
    process.exit(1)
})
