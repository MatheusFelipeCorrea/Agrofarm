import { prisma } from '../database/client.js'

const colheitaInclude = {
    fazendas: { select: { id: true, nome: true, localizacao: true } },
    culturas: { select: { id: true, nome: true, cor: true } },
    lucros: {
        where: { origem: 'VENDA_COLHEITA' },
        select: {
            id: true,
            quantidade_sacas: true,
            comprador: true,
            data: true,
            criado_em: true,
        },
        orderBy: [{ data: 'desc' }, { criado_em: 'desc' }],
    },
    entregas_arrendamento: {
        where: { status: 'ENTREGUE' },
        select: {
            id: true,
            quantidade_sacas: true,
            data: true,
            criado_em: true,
            fazendas: { select: { id: true, nome: true } },
        },
        orderBy: [{ data: 'desc' }, { criado_em: 'desc' }],
    },
}

function buildColheitaWhere({ fazendaId, culturaId, colheitaId, role, fazendasPermitidas }) {
    const where = {}

    if (colheitaId) {
        where.id = colheitaId
    }

    if (fazendaId && fazendaId !== 'all') {
        where.fazenda_id = fazendaId
    }

    if (role === 'FUNCIONARIO' && fazendasPermitidas?.length) {
        where.fazenda_id = fazendaId && fazendaId !== 'all'
            ? fazendaId
            : { in: fazendasPermitidas }
    }

    if (culturaId) {
        where.cultura_id = culturaId
    }

    return where
}

export const estoqueRepository = {
    buscarColheitasComLucros: async ({ fazendaId, culturaId, colheitaId, role, fazendasPermitidas }) => {
        const where = buildColheitaWhere({ fazendaId, culturaId, colheitaId, role, fazendasPermitidas })

        return prisma.colheitas.findMany({
            where,
            include: colheitaInclude,
            orderBy: [{ data_colheita: 'desc' }, { criado_em: 'desc' }],
        })
    },

    buscarColheitaPorId: async (id) => {
        return prisma.colheitas.findUnique({
            where: { id },
            include: colheitaInclude,
        })
    },

    buscarEntregasPendentes: async ({ fazendaId, culturaId, page = 1, pageSize = 50 } = {}) => {
        const where = { status: 'PENDENTE' }
        if (fazendaId && fazendaId !== 'all') where.fazenda_id = fazendaId
        if (culturaId) where.cultura_id = culturaId

        const [items, totalItems] = await Promise.all([
            prisma.entregas_arrendamento.findMany({
                where,
                include: {
                    fazendas: { select: { id: true, nome: true } },
                    culturas: { select: { id: true, nome: true, cor: true } },
                },
                orderBy: [{ data: 'asc' }, { criado_em: 'asc' }],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.entregas_arrendamento.count({ where }),
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

    buscarEntregaPorId: async (id) => {
        return prisma.entregas_arrendamento.findUnique({
            where: { id },
            include: {
                fazendas: { select: { id: true, nome: true } },
                culturas: { select: { id: true, nome: true, cor: true } },
            },
        })
    },

    atualizarEntrega: async (id, dados) => {
        return prisma.entregas_arrendamento.update({
            where: { id },
            data: dados,
            include: {
                fazendas: { select: { id: true, nome: true } },
                culturas: { select: { id: true, nome: true, cor: true } },
                colheitas: {
                    select: {
                        id: true,
                        ano: true,
                        fazendas: { select: { id: true, nome: true } },
                    },
                },
            },
        })
    },
}
