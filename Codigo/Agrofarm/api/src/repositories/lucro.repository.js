import { prisma } from '../database/client.js'

function buildAuthWhere({ role, usuarioId }) {
    if (role === 'ADMIN') return {}

    return {
        colheitas: {
            fazendas: {
                usuarios_fazendas: {
                    some: { usuario_id: usuarioId },
                },
            },
        },
    }
}

function buildFazendaFilter({ fazendaId, role, fazendaIdsPermitidas }) {
    if (fazendaId && fazendaId !== 'all' && role === 'ADMIN') {
        return { colheitas: { fazenda_id: fazendaId } }
    }

    if (role === 'ADMIN' && fazendaIdsPermitidas?.length) {
        return { colheitas: { fazenda_id: { in: fazendaIdsPermitidas } } }
    }

    if (role === 'FUNCIONARIO' && fazendaIdsPermitidas?.length) {
        return { colheitas: { fazenda_id: { in: fazendaIdsPermitidas } } }
    }

    return {}
}

function buildFiltersWhere({ fazendaId, culturaId, from, to, mes, ano, role, fazendaIdsPermitidas }) {
    const dataFilter = {}
    if (from || to) {
        const dateWhere = {}
        if (from) {
            dateWhere.gte = new Date(`${from}T00:00:00`)
        }
        if (to) {
            dateWhere.lte = new Date(`${to}T23:59:59`)
        }
        dataFilter.data = dateWhere
    } else if (mes || ano) {
        const year = ano ?? new Date().getFullYear()
        if (mes) {
            const startDate = new Date(year, mes - 1, 1)
            const endDate = new Date(year, mes, 0, 23, 59, 59)
            dataFilter.data = { gte: startDate, lte: endDate }
        } else {
            const startDate = new Date(year, 0, 1)
            const endDate = new Date(year, 11, 31, 23, 59, 59)
            dataFilter.data = { gte: startDate, lte: endDate }
        }
    }

    const fazendaFilter = buildFazendaFilter({ fazendaId, role, fazendaIdsPermitidas })

    if (culturaId) {
        const colheitasFilter = { cultura_id: culturaId }
        if (fazendaId && fazendaId !== 'all' && role === 'ADMIN') {
            colheitasFilter.fazenda_id = fazendaId
        } else if (role === 'FUNCIONARIO' && fazendaIdsPermitidas?.length) {
            colheitasFilter.fazenda_id = { in: fazendaIdsPermitidas }
        }
        return {
            ...dataFilter,
            origem: 'VENDA_COLHEITA',
            colheitas: colheitasFilter,
        }
    }

    if (Object.keys(fazendaFilter).length > 0) {
        return { ...dataFilter, ...fazendaFilter, origem: 'VENDA_COLHEITA' }
    }

    return { ...dataFilter, origem: 'VENDA_COLHEITA' }
}

const includeLucro = {
    colheitas: {
        include: {
            fazendas: { select: { id: true, nome: true } },
            culturas: { select: { id: true, nome: true, cor: true } },
        },
    },
}

export const lucroRepository = {
    buscarTodosComFiltros: async ({ fazendaId, culturaId, from, to, mes, ano, role, usuarioId, fazendaIdsPermitidas, page = 1, pageSize = 20 }) => {
        const where = {
            AND: [
                buildAuthWhere({ role, usuarioId, fazendaIdsPermitidas }),
                buildFiltersWhere({ fazendaId, culturaId, from, to, mes, ano, role, fazendaIdsPermitidas }),
            ],
        }

        const skip = (page - 1) * pageSize

        const [items, totalItems] = await Promise.all([
            prisma.lucros.findMany({
                where,
                include: includeLucro,
                orderBy: [{ data: 'desc' }, { criado_em: 'desc' }],
                skip,
                take: pageSize,
            }),
            prisma.lucros.count({ where }),
        ])

        return {
            items,
            meta: {
                page,
                pageSize,
                totalItems,
                totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
            },
        }
    },

    buscarTotalComFiltros: async ({ fazendaId, culturaId, from, to, mes, ano, role, usuarioId, fazendaIdsPermitidas }) => {
        const where = {
            AND: [
                buildAuthWhere({ role, usuarioId, fazendaIdsPermitidas }),
                buildFiltersWhere({ fazendaId, culturaId, from, to, mes, ano, role, fazendaIdsPermitidas }),
            ],
        }

        const lucros = await prisma.lucros.findMany({
            where,
            select: {
                quantidade_sacas: true,
                valor_unitario: true,
            },
        })

        const total = lucros.reduce(
            (acc, l) => acc + Number(l.quantidade_sacas) * Number(l.valor_unitario),
            0,
        )

        return { totalLucro: total }
    },

    buscarPorId: async (id) => {
        return prisma.lucros.findUnique({
            where: { id },
            include: includeLucro,
        })
    },

    buscarPorColheita: async (colheitaId) => {
        return prisma.lucros.findMany({
            where: { colheita_id: colheitaId, origem: 'VENDA_COLHEITA' },
            include: includeLucro,
            orderBy: { data: 'desc' },
        })
    },

    buscarPorColheitaComAuth: async ({ usuarioId, role, colheitaId }) => {
        return prisma.lucros.findMany({
            where: {
                AND: [
                    buildAuthWhere({ role, usuarioId }),
                    { colheita_id: colheitaId, origem: 'VENDA_COLHEITA' },
                ],
            },
            include: includeLucro,
            orderBy: { data: 'desc' },
        })
    },

    create: async (dados) => {
        return prisma.lucros.create({
            data: { ...dados, origem: 'VENDA_COLHEITA' },
            include: includeLucro,
        })
    },

    update: async (id, dados) => {
        return prisma.lucros.update({
            where: { id },
            data: dados,
            include: includeLucro,
        })
    },

    delete: async (id) => {
        return prisma.lucros.delete({ where: { id } })
    },
}
