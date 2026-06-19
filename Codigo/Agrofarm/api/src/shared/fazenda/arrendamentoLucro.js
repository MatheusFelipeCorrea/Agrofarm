import { prisma } from '../../database/client.js'
import { TIPO_FAZENDA_SOMENTE_LEITURA } from './fazendaOperacao.js'

const COMPRADOR_ARRENDAMENTO = 'Receita de arrendamento'

function parseDateOnly(value) {
    if (!value) return null
    if (value instanceof Date) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate())
    }
    const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d)
}

function formatDateOnly(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export function addPeriodoArrendamento(date, periodicidade) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    if (periodicidade === 'MENSAL') {
        next.setMonth(next.getMonth() + 1)
    } else if (periodicidade === 'SEMESTRAL') {
        next.setMonth(next.getMonth() + 6)
    } else if (periodicidade === 'ANUAL') {
        next.setFullYear(next.getFullYear() + 1)
    }
    return next
}

export function listarDatasRecebimentoAteHoje({ dataInicio, periodicidade, ate = new Date() }) {
    const inicio = parseDateOnly(dataInicio)
    if (!inicio || !periodicidade) return []

    const limite = parseDateOnly(ate)
    const datas = []
    let cursor = inicio

    while (cursor <= limite) {
        datas.push(formatDateOnly(cursor))
        cursor = addPeriodoArrendamento(cursor, periodicidade)
    }

    return datas
}

export function normalizarCamposArrendamento(dados) {
    if (dados.tipo !== TIPO_FAZENDA_SOMENTE_LEITURA) {
        return {
            arrendamento_valor: null,
            arrendamento_periodicidade: null,
            arrendamento_data_inicio: null,
        }
    }

    return {
        arrendamento_valor: dados.arrendamentoValor,
        arrendamento_periodicidade: dados.arrendamentoPeriodicidade,
        arrendamento_data_inicio: dados.arrendamentoDataInicio
            ? parseDateOnly(dados.arrendamentoDataInicio)
            : null,
    }
}

export async function sincronizarLucrosArrendamento(fazendaId) {
    const fazenda = await prisma.fazendas.findUnique({
        where: { id: fazendaId },
        select: {
            id: true,
            nome: true,
            tipo: true,
            arrendamento_valor: true,
            arrendamento_periodicidade: true,
            arrendamento_data_inicio: true,
        },
    })

    if (!fazenda || fazenda.tipo !== TIPO_FAZENDA_SOMENTE_LEITURA) {
        return { gerados: 0, removidos: 0 }
    }

    const valor = Number(fazenda.arrendamento_valor)
    const periodicidade = fazenda.arrendamento_periodicidade
    const dataInicio = fazenda.arrendamento_data_inicio

    if (!valor || valor <= 0 || !periodicidade || !dataInicio) {
        await prisma.lucros.deleteMany({
            where: { fazenda_id: fazendaId, origem: 'ARRENDAMENTO' },
        })
        return { gerados: 0, removidos: 0 }
    }

    const datasEsperadas = listarDatasRecebimentoAteHoje({
        dataInicio,
        periodicidade,
    })

    const existentes = await prisma.lucros.findMany({
        where: { fazenda_id: fazendaId, origem: 'ARRENDAMENTO' },
        select: { id: true, data: true, status_recebimento: true },
    })

    const existentesPorData = new Map(
        existentes.map((l) => [formatDateOnly(parseDateOnly(l.data)), l]),
    )

    let gerados = 0
    let atualizados = 0

    for (const dataStr of datasEsperadas) {
        const data = parseDateOnly(dataStr)
        const existente = existentesPorData.get(dataStr)

        if (existente) {
            await prisma.lucros.update({
                where: { id: existente.id },
                data: {
                    quantidade_sacas: 1,
                    valor_unitario: valor,
                    comprador: COMPRADOR_ARRENDAMENTO,
                },
            })
            atualizados += 1
            continue
        }

        await prisma.lucros.create({
            data: {
                fazenda_id: fazendaId,
                origem: 'ARRENDAMENTO',
                colheita_id: null,
                status_recebimento: 'PENDENTE',
                quantidade_sacas: 1,
                valor_unitario: valor,
                comprador: COMPRADOR_ARRENDAMENTO,
                data,
            },
        })
        gerados += 1
    }

    const datasSet = new Set(datasEsperadas)
    const idsRemover = existentes
        .filter((l) => !datasSet.has(formatDateOnly(parseDateOnly(l.data))))
        .map((l) => l.id)

    if (idsRemover.length) {
        await prisma.lucros.deleteMany({ where: { id: { in: idsRemover } } })
    }

    return { gerados, atualizados, removidos: idsRemover.length }
}
