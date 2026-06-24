import { AppError } from '../shared/errors/AppError.js'
import { assertFazendaOperavelPorColheitaId } from '../shared/fazenda/fazendaOperacao.js'
import { calcularSaldoColheita, assertVendaSacasPermitida } from '../shared/estoque/saldoSacas.js'
import { lucroRepository } from '../repositories/lucro.repository.js'
import { prisma } from '../database/client.js'

async function getFazendaIdsPermitidas(usuarioId) {
    const registros = await prisma.usuarios_fazendas.findMany({
        where: { usuario_id: usuarioId },
        select: { fazenda_id: true },
    })
    return registros.map((r) => r.fazenda_id)
}

function toDateOnly(value) {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    d.setHours(0, 0, 0, 0)
    return d
}

async function assertVendaAposColheita({ colheitaId, dataVenda }) {
    if (!dataVenda) return

    const colheita = await prisma.colheitas.findUnique({
        where: { id: colheitaId },
        select: { data_colheita: true },
    })

    if (!colheita?.data_colheita) return

    const venda = toDateOnly(typeof dataVenda === 'string' ? `${dataVenda}T00:00:00` : dataVenda)
    const dataColheita = toDateOnly(colheita.data_colheita)

    if (venda && dataColheita && venda < dataColheita) {
        throw new AppError('A data da venda não pode ser anterior à data da colheita', 400)
    }
}

async function validarSaldoSacas({ colheitaId, quantidadeSacas, lucroIdIgnorar }) {
    const saldo = await calcularSaldoColheita(colheitaId, { lucroIdIgnorar })

    if (!saldo) {
        throw new AppError('Colheita não encontrada', 404)
    }

    assertVendaSacasPermitida({
        quantidadeSacas,
        totalProduzido: saldo.totalProduzido,
        saldoDisponivel: saldo.saldoDisponivel,
        culturaNome: saldo.colheita.culturas?.nome,
    })
}

export const lucroService = {
    listar: async ({ usuarioId, role, query }) => {
        let fazendaIdsPermitidas = []

        if (role === 'FUNCIONARIO') {
            fazendaIdsPermitidas = await getFazendaIdsPermitidas(usuarioId)
            if (fazendaIdsPermitidas.length === 0) {
                throw new AppError('Funcionario sem fazendas vinculadas', 422)
            }
        }

        return lucroRepository.buscarTodosComFiltros({
            fazendaId: query.fazendaId,
            culturaId: query.culturaId,
            from: query.from,
            to: query.to,
            mes: query.mes ? Number(query.mes) : undefined,
            ano: query.ano ? Number(query.ano) : undefined,
            role,
            usuarioId,
            fazendaIdsPermitidas,
            page: query.page,
            pageSize: query.pageSize,
        })
    },

    buscarTotal: async ({ usuarioId, role, query }) => {
        let fazendaIdsPermitidas = []

        if (role === 'FUNCIONARIO') {
            fazendaIdsPermitidas = await getFazendaIdsPermitidas(usuarioId)
            if (fazendaIdsPermitidas.length === 0) {
                throw new AppError('Funcionario sem fazendas vinculadas', 422)
            }
        }

        return lucroRepository.buscarTotalComFiltros({
            fazendaId: query.fazendaId,
            culturaId: query.culturaId,
            from: query.from,
            to: query.to,
            mes: query.mes ? Number(query.mes) : undefined,
            ano: query.ano ? Number(query.ano) : undefined,
            role,
            usuarioId,
            fazendaIdsPermitidas,
        })
    },

    buscarPorColheita: async ({ usuarioId, role, colheitaId }) => {
        return lucroRepository.buscarPorColheitaComAuth({ usuarioId, role, colheitaId })
    },

    criar: async ({ usuarioId, role, payload }) => {
        if (role === 'FUNCIONARIO') {
            const fazendaIdsPermitidas = await getFazendaIdsPermitidas(usuarioId)
            if (fazendaIdsPermitidas.length === 0) {
                throw new AppError('Funcionario sem fazendas vinculadas', 422)
            }
            const colheita = await prisma.colheitas.findFirst({
                where: {
                    id: payload.colheitaId,
                    fazenda_id: { in: fazendaIdsPermitidas },
                },
                select: { id: true },
            })
            if (!colheita) {
                throw new AppError('Sem permissao para registrar lucro nesta fazenda', 403)
            }
        } else {
            const colheita = await prisma.colheitas.findUnique({
                where: { id: payload.colheitaId },
                select: { id: true },
            })
            if (!colheita) {
                throw new AppError('Colheita não encontrada', 404)
            }
        }

        await assertFazendaOperavelPorColheitaId(payload.colheitaId)

        await assertVendaAposColheita({
            colheitaId: payload.colheitaId,
            dataVenda: payload.data,
        })

        await validarSaldoSacas({
            colheitaId: payload.colheitaId,
            quantidadeSacas: payload.quantidadeSacas,
        })

        return lucroRepository.create({
            colheita_id: payload.colheitaId,
            quantidade_sacas: payload.quantidadeSacas,
            valor_unitario: payload.valorUnitario,
            comprador: payload.comprador,
            data: new Date(`${payload.data}T00:00:00`),
        })
    },

    atualizar: async ({ usuarioId, role, id, payload }) => {
        const lucroExistente = await lucroRepository.buscarPorId(id)
        if (!lucroExistente) {
            throw new AppError('Lucro não encontrado', 404)
        }

        const colheitaIdOperacao = payload.colheitaId ?? lucroExistente.colheita_id
        await assertFazendaOperavelPorColheitaId(colheitaIdOperacao)

        if (role === 'FUNCIONARIO') {
            const fazendaIdsPermitidas = await getFazendaIdsPermitidas(usuarioId)
            const fazendaAtual = lucroExistente.colheitas?.fazendas?.id ?? lucroExistente.colheitas?.fazenda_id
            if (fazendaAtual && !fazendaIdsPermitidas.includes(fazendaAtual)) {
                throw new AppError('Sem permissao para editar lucro nesta fazenda', 403)
            }

            if (payload.colheitaId && payload.colheitaId !== lucroExistente.colheita_id) {
                const colheita = await prisma.colheitas.findFirst({
                    where: { id: payload.colheitaId, fazenda_id: { in: fazendaIdsPermitidas } },
                    select: { id: true },
                })
                if (!colheita) {
                    throw new AppError('Sem permissao para registrar lucro nesta fazenda', 403)
                }
            }
        } else if (payload.colheitaId) {
            const colheita = await prisma.colheitas.findUnique({
                where: { id: payload.colheitaId },
                select: { id: true },
            })
            if (!colheita) {
                throw new AppError('Colheita não encontrada', 404)
            }
        }

        const colheitaIdFinal = payload.colheitaId ?? lucroExistente.colheita_id
        const quantidadeSacasFinal = payload.quantidadeSacas ?? Number(lucroExistente.quantidade_sacas)

        if (colheitaIdFinal) {
            await assertVendaAposColheita({
                colheitaId: colheitaIdFinal,
                dataVenda: payload.data ?? lucroExistente.data,
            })
        }

        await validarSaldoSacas({
            colheitaId: colheitaIdFinal,
            quantidadeSacas: quantidadeSacasFinal,
            lucroIdIgnorar: id,
        })

        const dados = {
            ...(payload.colheitaId !== undefined ? { colheita_id: payload.colheitaId } : {}),
            ...(payload.quantidadeSacas !== undefined ? { quantidade_sacas: payload.quantidadeSacas } : {}),
            ...(payload.valorUnitario !== undefined ? { valor_unitario: payload.valorUnitario } : {}),
            ...(payload.comprador !== undefined ? { comprador: payload.comprador } : {}),
            ...(payload.data !== undefined ? { data: new Date(`${payload.data}T00:00:00`) } : {}),
        }

        return lucroRepository.update(id, dados)
    },

    deletar: async ({ usuarioId, role, id }) => {
        const lucro = await lucroRepository.buscarPorId(id)
        if (!lucro) {
            throw new AppError('Lucro não encontrado', 404)
        }

        if (lucro.colheita_id) {
            await assertFazendaOperavelPorColheitaId(lucro.colheita_id)
        }

        if (role === 'FUNCIONARIO') {
            const fazendaIdsPermitidas = await getFazendaIdsPermitidas(usuarioId)
            const fazendaAtual = lucro.colheitas?.fazendas?.id ?? lucro.colheitas?.fazenda_id
            if (fazendaAtual && !fazendaIdsPermitidas.includes(fazendaAtual)) {
                throw new AppError('Sem permissao para excluir lucro nesta fazenda', 403)
            }
        }

        await lucroRepository.delete(id)
    },
}
