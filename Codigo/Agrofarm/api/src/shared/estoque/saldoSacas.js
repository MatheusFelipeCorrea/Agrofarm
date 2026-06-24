import { AppError } from '../errors/AppError.js'
import { prisma } from '../../database/client.js'

/**
 * Calcula saldo de sacas disponíveis para venda ou entrega de arrendamento em uma colheita.
 */
export async function calcularSaldoColheita(colheitaId, { lucroIdIgnorar, entregaIdIgnorar } = {}) {
    const colheita = await prisma.colheitas.findUnique({
        where: { id: colheitaId },
        select: {
            id: true,
            sacas_produzidas: true,
            cultura_id: true,
            fazenda_id: true,
            culturas: { select: { nome: true } },
        },
    })

    if (!colheita) {
        return null
    }

    const [vendasAgg, arrendamentosAgg] = await Promise.all([
        prisma.lucros.aggregate({
            _sum: { quantidade_sacas: true },
            where: {
                colheita_id: colheitaId,
                origem: 'VENDA_COLHEITA',
                ...(lucroIdIgnorar ? { id: { not: lucroIdIgnorar } } : {}),
            },
        }),
        prisma.entregas_arrendamento.aggregate({
            _sum: { quantidade_sacas: true },
            where: {
                colheita_id: colheitaId,
                status: 'ENTREGUE',
                ...(entregaIdIgnorar ? { id: { not: entregaIdIgnorar } } : {}),
            },
        }),
    ])

    const totalProduzido = Number(colheita.sacas_produzidas ?? 0)
    const totalVendido = Number(vendasAgg?._sum?.quantidade_sacas ?? 0)
    const totalArrendamento = Number(arrendamentosAgg?._sum?.quantidade_sacas ?? 0)
    const totalSaidas = totalVendido + totalArrendamento
    const saldoDisponivel = totalProduzido - totalSaidas

    return {
        colheita,
        totalProduzido,
        totalVendido,
        totalArrendamento,
        totalSaidas,
        saldoDisponivel,
    }
}

export function assertVendaSacasPermitida({ quantidadeSacas, totalProduzido, saldoDisponivel, culturaNome }) {
    const quantidadeSolicitada = Number(quantidadeSacas)

    if (!Number.isFinite(quantidadeSolicitada) || quantidadeSolicitada <= 0) {
        throw new AppError('Quantidade de sacas deve ser maior que zero', 400)
    }

    if (!Number.isFinite(totalProduzido) || totalProduzido <= 0) {
        const sufixo = culturaNome ? ` para ${culturaNome}` : ''
        throw new AppError(
            `Não há sacas em estoque${sufixo}. Registre a produção na colheita antes de registrar a venda.`,
            400,
        )
    }

    const saldo = Number(saldoDisponivel)
    if (!Number.isFinite(saldo) || saldo <= 0) {
        throw new AppError(
            `Não há sacas disponíveis em estoque. Disponível: 0 sacas.`,
            400,
        )
    }

    if (quantidadeSolicitada > saldo) {
        throw new AppError(
            `Quantidade de sacas excede o estoque disponível. Disponível: ${Math.max(saldo, 0).toFixed(2)} sacas.`,
            400,
        )
    }
}
