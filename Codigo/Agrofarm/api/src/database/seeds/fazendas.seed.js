import 'dotenv/config'
import prisma from '../client.js'

async function seed() {
    console.log('🌱 Criando fazendas...')

    const fazendas = [
        {
            nome: 'Fazenda Santa Maria',
            tipo: 'PROPRIA',
            localizacao: 'Uberaba - MG',
        },
        {
            nome: 'Fazenda Boa Vista',
            tipo: 'PROPRIA',
            localizacao: 'Uberlândia - MG',
        },
        {
            nome: 'Fazenda São José',
            tipo: 'ARRENDADA_DE_TERCEIROS',
            localizacao: 'Patos de Minas - MG',
        },
    ]

    for (const fazenda of fazendas) {
        const created = await prisma.fazendas.create({
            data: fazenda,
        })
        console.log(`✅ Fazenda criada: ${created.nome} - ${created.localizacao}`)
    }

    const soja = await prisma.culturas.findUnique({ where: { nome: 'Soja' } })
    const milho = await prisma.culturas.findUnique({ where: { nome: 'Milho' } })
    const cafe = await prisma.culturas.findUnique({ where: { nome: 'Café' } })

    const santaMaria = await prisma.fazendas.findFirst({ where: { nome: 'Fazenda Santa Maria' } })
    const boaVista = await prisma.fazendas.findFirst({ where: { nome: 'Fazenda Boa Vista' } })
    const saoJose = await prisma.fazendas.findFirst({ where: { nome: 'Fazenda São José' } })

    if (soja && milho && cafe && santaMaria && boaVista && saoJose) {
        console.log('🌱 Criando vínculos fazenda-cultura...')

        await prisma.fazenda_culturas.create({
            data: {
                fazenda_id: santaMaria.id,
                cultura_id: soja.id,
                hectares: 150.5,
                status: 'COLHEITA',
            },
        })

        await prisma.fazenda_culturas.create({
            data: {
                fazenda_id: santaMaria.id,
                cultura_id: milho.id,
                hectares: 80.0,
                status: 'PLANTIO',
            },
        })

        await prisma.fazenda_culturas.create({
            data: {
                fazenda_id: boaVista.id,
                cultura_id: cafe.id,
                hectares: 200.0,
                status: 'ADUBACAO',
            },
        })

        await prisma.fazenda_culturas.create({
            data: {
                fazenda_id: saoJose.id,
                cultura_id: soja.id,
                hectares: 120.0,
                status: 'SECAGEM',
            },
        })

        console.log('✅ Vínculos criados com sucesso!')
    }

    console.log('🎉 Seed de fazendas concluído!')
    await prisma.$disconnect()
}

seed().catch((e) => {
    console.error('❌ Erro no seed:', e)
    prisma.$disconnect()
    process.exit(1)
})
