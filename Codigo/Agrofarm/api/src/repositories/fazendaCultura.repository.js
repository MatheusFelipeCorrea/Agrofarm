import { prisma } from '../database/client.js'

const includeCultura = {
    culturas: true,
}

export const fazendaCulturaRepository = {
    listarPorFazenda: async (fazendaId) => {
        return prisma.fazenda_culturas.findMany({
            where: { fazenda_id: fazendaId },
            include: includeCultura,
            orderBy: {
                culturas: {
                    nome: 'asc',
                },
            },
        })
    },

    buscarPorId: async (id) => {
        return prisma.fazenda_culturas.findUnique({
            where: { id },
            include: includeCultura,
        })
    },

    buscarPorChave: async ({ fazendaId, culturaId }) => {
        return prisma.fazenda_culturas.findUnique({
            where: {
                fazenda_id_cultura_id: {
                    fazenda_id: fazendaId,
                    cultura_id: culturaId,
                },
            },
            include: includeCultura,
        })
    },

    create: async ({ fazendaId, culturaId, hectares, status }) => {
        return prisma.fazenda_culturas.create({
            data: {
                fazenda_id: fazendaId,
                cultura_id: culturaId,
                hectares,
                status,
            },
            include: includeCultura,
        })
    },

    update: async (id, dados) => {
        return prisma.fazenda_culturas.update({
            where: { id },
            data: dados,
            include: includeCultura,
        })
    },

    delete: async (id) => {
        return prisma.fazenda_culturas.delete({
            where: { id },
        })
    },

    sumHectaresTalhoes: async (fazendaId, culturaId) => {
        const agg = await prisma.poligonos_fazenda.aggregate({
            where: {
                fazenda_id: fazendaId,
                cultura_id: culturaId,
            },
            _sum: { area_hectares: true },
        })
        return Number(agg._sum.area_hectares ?? 0)
    },
}

