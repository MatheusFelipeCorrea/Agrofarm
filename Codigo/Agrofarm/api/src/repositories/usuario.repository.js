import { prisma } from '../database/client.js'

const usuarioWithFazendasInclude = {
    usuarios_fazendas: {
        include: {
            fazendas: {
                select: {
                    id: true,
                    nome: true,
                },
            },
        },
        orderBy: {
            fazendas: {
                nome: 'asc',
            },
        },
    },
}

export const usuarioRepository = {
    buscarTodos: async () => {
        return prisma.usuarios.findMany({
            orderBy: { criado_em: 'desc' },
            include: usuarioWithFazendasInclude,
        })
    },

    buscarTodosComFazendas: async () => {
        return prisma.usuarios.findMany({
            orderBy: { criado_em: 'desc' },
            include: usuarioWithFazendasInclude,
        })
    },

    buscarPorId: async (id) => {
        return prisma.usuarios.findUnique({
            where: { id },
            include: usuarioWithFazendasInclude,
        })
    },

    buscarPorIdComFazendas: async (id) => {
        return prisma.usuarios.findUnique({
            where: { id },
            include: usuarioWithFazendasInclude,
        })
    },

    buscarIdsFazendasVinculadas: async (id) => {
        const usuario = await prisma.usuarios.findUnique({
            where: { id },
            select: {
                usuarios_fazendas: {
                    select: {
                        fazenda_id: true,
                    },
                },
            },
        })

        return (usuario?.usuarios_fazendas ?? []).map((vinculo) => vinculo.fazenda_id)
    },

    buscarPorEmail: async (email) => {
        return prisma.usuarios.findUnique({
            where: { email },
            include: usuarioWithFazendasInclude,
        })
    },

    update: async (id, dados) => {
        return prisma.usuarios.update({
            where: { id },
            data: dados,
            include: usuarioWithFazendasInclude,
        })
    },

    criarVinculosDeFazenda: async (usuarioId, fazendaIds) => {
        if (!fazendaIds?.length) {
            return { count: 0 }
        }

        return prisma.usuarios_fazendas.createMany({
            data: fazendaIds.map((fazendaId) => ({ usuario_id: usuarioId, fazenda_id: fazendaId })),
            skipDuplicates: true,
        })
    },

    removerVinculosDeFazenda: async (usuarioId) => {
        return prisma.usuarios_fazendas.deleteMany({
            where: { usuario_id: usuarioId },
        })
    },

    substituirFazendasDoUsuario: async (usuarioId, fazendaIds) => {
        return prisma.$transaction(async (tx) => {
            await tx.usuarios_fazendas.deleteMany({
                where: { usuario_id: usuarioId },
            })

            if (fazendaIds?.length) {
                await tx.usuarios_fazendas.createMany({
                    data: fazendaIds.map((fazendaId) => ({ usuario_id: usuarioId, fazenda_id: fazendaId })),
                    skipDuplicates: true,
                })
            }

            return tx.usuarios.findUnique({
                where: { id: usuarioId },
                include: usuarioWithFazendasInclude,
            })
        })
    },

    delete: async (id) => {
        return prisma.usuarios.delete({
            where: { id },
        })
    },
}
