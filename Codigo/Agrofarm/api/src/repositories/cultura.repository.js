import { prisma } from '../database/client.js'

export const culturaRepository = {
    buscarTodos: async () => {
        return prisma.culturas.findMany({
            orderBy: { nome: 'asc' },
        })
    },

    buscarPorId: async (id) => {
        return prisma.culturas.findUnique({
            where: { id },
        })
    },

    buscarPorNome: async (nome) => {
        return prisma.culturas.findUnique({
            where: { nome },
        })
    },

    create: async (dados) => {
        return prisma.culturas.create({
            data: dados,
        })
    },

    update: async (id, dados) => {
        return prisma.culturas.update({
            where: { id },
            data: dados,
        })
    },

    delete: async (id) => {
        return prisma.culturas.delete({
            where: { id },
        })
    },

    contarVinculos: async (id) => {
        const [fazendaCulturas, colheitas] = await Promise.all([
            prisma.fazenda_culturas.count({ where: { cultura_id: id } }),
            prisma.colheitas.count({ where: { cultura_id: id } }),
        ])

        return { fazendaCulturas, colheitas }
    },
}
