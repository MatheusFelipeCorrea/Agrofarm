import { prisma } from '../../database/client.js'
import { TIPO_FAZENDA_SOMENTE_LEITURA } from './fazendaOperacao.js'

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
            arrendamento_cultura_id: null,
            arrendamento_quantidade_sacas: null,
            arrendamento_periodicidade: null,
            arrendamento_data_inicio: null,
        }
    }

    return {
        arrendamento_cultura_id: dados.arrendamentoCulturaId ?? null,
        arrendamento_quantidade_sacas: dados.arrendamentoQuantidadeSacas ?? null,
        arrendamento_periodicidade: dados.arrendamentoPeriodicidade,
        arrendamento_data_inicio: dados.arrendamentoDataInicio
            ? parseDateOnly(dados.arrendamentoDataInicio)
            : null,
    }
}

export async function sincronizarEntregasArrendamento(fazendaId) {
    const fazenda = await prisma.fazendas.findUnique({
        where: { id: fazendaId },
        select: {
            id: true,
            nome: true,
            tipo: true,
            arrendamento_cultura_id: true,
            arrendamento_quantidade_sacas: true,
            arrendamento_periodicidade: true,
            arrendamento_data_inicio: true,
        },
    })

    if (!fazenda || fazenda.tipo !== TIPO_FAZENDA_SOMENTE_LEITURA) {
        return { gerados: 0, removidos: 0 }
    }

    const culturaId = fazenda.arrendamento_cultura_id
    const quantidadeSacas = Number(fazenda.arrendamento_quantidade_sacas)
    const periodicidade = fazenda.arrendamento_periodicidade
    const dataInicio = fazenda.arrendamento_data_inicio

    if (!culturaId || !quantidadeSacas || quantidadeSacas <= 0 || !periodicidade || !dataInicio) {
        await prisma.entregas_arrendamento.deleteMany({
            where: { fazenda_id: fazendaId, status: 'PENDENTE' },
        })
        return { gerados: 0, removidos: 0 }
    }

    const datasEsperadas = listarDatasRecebimentoAteHoje({
        dataInicio,
        periodicidade,
    })

    const existentes = await prisma.entregas_arrendamento.findMany({
        where: { fazenda_id: fazendaId },
        select: { id: true, data: true, status: true },
    })

    const existentesPorData = new Map(
        existentes.map((e) => [formatDateOnly(parseDateOnly(e.data)), e]),
    )

    let gerados = 0
    let atualizados = 0

    for (const dataStr of datasEsperadas) {
        const data = parseDateOnly(dataStr)
        const existente = existentesPorData.get(dataStr)

        if (existente) {
            if (existente.status === 'PENDENTE') {
                await prisma.entregas_arrendamento.update({
                    where: { id: existente.id },
                    data: {
                        cultura_id: culturaId,
                        quantidade_sacas: quantidadeSacas,
                    },
                })
                atualizados += 1
            }
            continue
        }

        await prisma.entregas_arrendamento.create({
            data: {
                fazenda_id: fazendaId,
                cultura_id: culturaId,
                quantidade_sacas: quantidadeSacas,
                status: 'PENDENTE',
                data,
            },
        })
        gerados += 1
    }

    const datasSet = new Set(datasEsperadas)
    const idsRemover = existentes
        .filter(
            (e) =>
                e.status === 'PENDENTE' &&
                !datasSet.has(formatDateOnly(parseDateOnly(e.data))),
        )
        .map((e) => e.id)

    if (idsRemover.length) {
        await prisma.entregas_arrendamento.deleteMany({ where: { id: { in: idsRemover } } })
    }

    return { gerados, atualizados, removidos: idsRemover.length }
}

export async function sincronizarEntregasArrendamentoAutomaticos() {
    const fazendas = await prisma.fazendas.findMany({
        where: {
            tipo: 'ARRENDADA_PARA_TERCEIROS',
            arrendamento_cultura_id: { not: null },
            arrendamento_quantidade_sacas: { not: null },
            arrendamento_periodicidade: { not: null },
            arrendamento_data_inicio: { not: null },
        },
        select: { id: true },
    })

    await Promise.all(fazendas.map((f) => sincronizarEntregasArrendamento(f.id)))
}
