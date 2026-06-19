import { prisma } from '../../database/client.js'
import { AppError } from '../errors/AppError.js'

export const TIPO_FAZENDA_SOMENTE_LEITURA = 'ARRENDADA_PARA_TERCEIROS'

const MENSAGEM_BLOQUEIO =
    'Esta fazenda é arrendada para terceiros e permite apenas consulta. Não é possível alterar dados operacionais.'

export function isFazendaSomenteLeitura(tipo) {
    return tipo === TIPO_FAZENDA_SOMENTE_LEITURA
}

export function podeOperarFazenda(tipo) {
    return !isFazendaSomenteLeitura(tipo)
}

export function assertFazendaOperavel(fazenda) {
    if (!fazenda) {
        throw new AppError('Fazenda não encontrada', 404)
    }
    if (isFazendaSomenteLeitura(fazenda.tipo)) {
        throw new AppError(MENSAGEM_BLOQUEIO, 403)
    }
}

export async function assertFazendaOperavelPorId(fazendaId) {
    const fazenda = await prisma.fazendas.findUnique({
        where: { id: fazendaId },
        select: { id: true, tipo: true },
    })
    assertFazendaOperavel(fazenda)
    return fazenda
}

export async function assertFazendaOperavelPorColheitaId(colheitaId) {
    const colheita = await prisma.colheitas.findUnique({
        where: { id: colheitaId },
        select: { id: true, fazenda_id: true },
    })
    if (!colheita) {
        throw new AppError('Colheita não encontrada', 404)
    }
    await assertFazendaOperavelPorId(colheita.fazenda_id)
    return colheita
}
