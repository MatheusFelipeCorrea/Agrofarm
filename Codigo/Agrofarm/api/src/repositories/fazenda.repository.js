import { prisma } from '../database/client.js'
import { lembreteVinculosInclude } from '../shared/lembrete/lembreteIncludes.js'

const fazendaIncludeCulturas = {
    fazenda_culturas: {
        include: {
            culturas: true,
        },
        orderBy: {
            culturas: {
                nome: 'asc',
            },
        },
    },
    arrendamento_culturas: {
        select: { id: true, nome: true, cor: true },
    },
}

export const fazendaRepository = {
    buscarTodos: async () => {
        return prisma.fazendas.findMany({
            orderBy: { criado_em: 'asc' },
            include: fazendaIncludeCulturas,
        })
    },

    buscarTodosPorUsuario: async (usuarioId) => {
        return prisma.fazendas.findMany({
            where: {
                usuarios_fazendas: { some: { usuario_id: usuarioId } },
            },
            orderBy: { criado_em: 'asc' },
            include: fazendaIncludeCulturas,
        })
    },

    usuarioTemVinculo: async (usuarioId, fazendaId) => {
        const v = await prisma.usuarios_fazendas.findFirst({
            where: { usuario_id: usuarioId, fazenda_id: fazendaId },
            select: { id: true },
        })
        return Boolean(v)
    },

    buscarPorId: async (id) => {
        return prisma.fazendas.findUnique({
            where: { id },
            include: fazendaIncludeCulturas,
        })
    },

    buscarPorNome: async (nome, { ignorarId } = {}) => {
        return prisma.fazendas.findFirst({
            where: {
                nome: { equals: nome, mode: 'insensitive' },
                ...(ignorarId ? { id: { not: ignorarId } } : {}),
            },
            select: { id: true },
        })
    },

    create: async (dados) => {
        return prisma.fazendas.create({
            data: dados,
            include: fazendaIncludeCulturas,
        })
    },

    update: async (id, dados) => {
        return prisma.fazendas.update({
            where: { id },
            data: dados,
            include: fazendaIncludeCulturas,
        })
    },

    delete: async (id) => {
        return prisma.fazendas.delete({
            where: { id },
        })
    },

    contarVinculos: async (id) => {
        const [fazendaCulturas, insumosAtividades, lembretes, colheitas] = await Promise.all([
            prisma.fazenda_culturas.count({ where: { fazenda_id: id } }),
            prisma.insumos_atividades.count({ where: { fazenda_id: id } }),
            prisma.lembretes.count({ where: { fazenda_id: id } }),
            prisma.colheitas.count({ where: { fazenda_id: id } }),
        ])

        return { fazendaCulturas, insumosAtividades, lembretes, colheitas }
    },

    sumAreaHectaresByFazenda: async (fazendaId) => {
        const rows = await prisma.$queryRaw`
            SELECT COALESCE(SUM(area_hectares), 0)::float AS total
            FROM poligonos_fazenda
            WHERE fazenda_id = ${fazendaId}::uuid
        `
        return Number(rows[0]?.total ?? 0)
    },

    sumAreaHectaresByFazendaIds: async (fazendaIds) => {
        if (!fazendaIds?.length) return new Map()
        const rows = await prisma.$queryRaw`
            SELECT fazenda_id, COALESCE(SUM(area_hectares), 0)::float AS total
            FROM poligonos_fazenda
            WHERE fazenda_id = ANY(${fazendaIds}::uuid[])
            GROUP BY fazenda_id
        `
        return new Map(rows.map((r) => [r.fazenda_id, Number(r.total ?? 0)]))
    },

    contarPoligonos: async (fazendaId) => {
        return prisma.poligonos_fazenda.count({ where: { fazenda_id: fazendaId } })
    },

    contarCulturasAtivas: async (fazendaId) => {
        return prisma.fazenda_culturas.count({ where: { fazenda_id: fazendaId } })
    },

    contarFuncionariosVinculados: async (fazendaId) => {
        return prisma.usuarios_fazendas.count({ where: { fazenda_id: fazendaId } })
    },

    listarLembretesProximos: async (fazendaId, limite = 5) => {
        return prisma.lembretes.findMany({
            where: { fazenda_id: fazendaId },
            orderBy: [{ data_lembrete: 'asc' }, { criado_em: 'asc' }],
            take: limite,
            select: {
                id: true,
                titulo: true,
                data_lembrete: true,
                status: true,
                criado_em: true,
            },
        })
    },

    listarLembretesPorFazenda: async (fazendaId) => {
        return prisma.lembretes.findMany({
            where: { fazenda_id: fazendaId },
            orderBy: [{ data_lembrete: 'asc' }, { criado_em: 'asc' }],
            include: lembreteVinculosInclude,
        })
    },

    listarFuncionariosVinculados: async (fazendaId) => {
        const vinculos = await prisma.usuarios_fazendas.findMany({
            where: { fazenda_id: fazendaId },
            include: {
                usuarios: { select: { id: true, nome: true, role: true } },
            },
            orderBy: { criado_em: 'asc' },
        })
        return vinculos.map((v) => v.usuarios).filter(Boolean)
    },
}
