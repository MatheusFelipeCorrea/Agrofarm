import { prisma } from '../database/client.js'

const colheitaInclude = {
    fazendas: { select: { id: true, nome: true, localizacao: true } },
    culturas: { select: { id: true, nome: true, cor: true } },
    lucros: {
        select: {
            id: true,
            quantidade_sacas: true,
            comprador: true,
            data: true,
            criado_em: true,
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
}
