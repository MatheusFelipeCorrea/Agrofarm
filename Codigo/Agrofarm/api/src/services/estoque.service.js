import { AppError } from '../shared/errors/AppError.js'
import { estoqueRepository } from '../repositories/estoque.repository.js'
import { usuarioRepository } from '../repositories/usuario.repository.js'

/** Percentual mínimo do produzido para considerar "Em estoque" (abaixo disso = estoque baixo). */
const ESTOQUE_BAIXO_LIMITE = 0.15

function normalizeFiltros({ query, role }) {
    const fazendaId = query.fazendaId

    if (role !== 'ADMIN' && fazendaId === 'all') {
        throw new AppError('Parametros de filtro invalidos', 400)
    }

    return {
        fazendaId: fazendaId === 'all' ? undefined : fazendaId,
        culturaId: query.culturaId,
        colheitaId: query.colheitaId,
        busca: query.busca?.trim()?.toLowerCase() || '',
    }
}

function abreviarCultura(nome) {
    return String(nome ?? 'LOTE')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 12)
}

function gerarCodigosLote(colheitas) {
    const grupos = new Map()

    colheitas.forEach((c) => {
        const chave = `${c.cultura_id}-${c.ano}`
        if (!grupos.has(chave)) grupos.set(chave, [])
        grupos.get(chave).push(c)
    })

    const mapa = new Map()

    grupos.forEach((lista) => {
        const ordenadas = [...lista].sort((a, b) => {
            const da = new Date(a.data_colheita).getTime()
            const db = new Date(b.data_colheita).getTime()
            if (da !== db) return da - db
            return new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
        })

        ordenadas.forEach((c, index) => {
            const abrev = abreviarCultura(c.culturas?.nome)
            mapa.set(c.id, `${abrev}-${c.ano}-${String(index + 1).padStart(2, '0')}`)
        })
    })

    return mapa
}

function calcularStatus(emEstoque, produzidas) {
    if (produzidas <= 0) return 'EM_ESTOQUE'
    const ratio = emEstoque / produzidas
    return ratio < ESTOQUE_BAIXO_LIMITE ? 'ESTOQUE_BAIXO' : 'EM_ESTOQUE'
}

function formatarDataHora(date) {
    if (!date) return null
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return null
    const dia = String(d.getDate()).padStart(2, '0')
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const ano = d.getFullYear()
    const hora = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${dia}/${mes}/${ano} ${hora}:${min}`
}

function formatarData(date) {
    if (!date) return null
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return null
    const dia = String(d.getDate()).padStart(2, '0')
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const ano = d.getFullYear()
    return `${dia}/${mes}/${ano}`
}

function montarMovimentacoes(colheita) {
    const produzidas = Number(colheita.sacas_produzidas ?? 0)
    const movimentos = []

    movimentos.push({
        id: `entrada-${colheita.id}`,
        tipo: 'ENTRADA_INICIAL',
        quantidadeSacas: produzidas,
        data: colheita.data_colheita,
        dataHora: formatarDataHora(colheita.criado_em ?? colheita.data_colheita),
        descricao: 'Entrada inicial da colheita',
    })

    ;(colheita.lucros ?? []).forEach((lucro) => {
        const qtd = Number(lucro.quantidade_sacas ?? 0)
        movimentos.push({
            id: lucro.id,
            tipo: 'VENDA',
            quantidadeSacas: qtd,
            data: lucro.data,
            dataHora: formatarDataHora(lucro.criado_em ?? lucro.data),
            descricao: lucro.comprador ? `Venda para ${lucro.comprador}` : 'Venda de sacas',
        })
    })

    return movimentos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
}

function montarLoteRow(colheita, codigoLote) {
    const produzidas = Number(colheita.sacas_produzidas ?? 0)
    const vendidas = (colheita.lucros ?? []).reduce(
        (acc, l) => acc + Number(l.quantidade_sacas ?? 0),
        0,
    )
    const emEstoque = Math.max(produzidas - vendidas, 0)
    const movimentacoes = montarMovimentacoes(colheita)
    const ultima = movimentacoes[0] ?? null

    let ultimaDescricao = ultima?.descricao ?? '—'
    if (ultima?.tipo === 'VENDA') {
        ultimaDescricao = `Venda - ${Number(ultima.quantidadeSacas).toLocaleString('pt-BR')} sacas`
    } else if (ultima?.tipo === 'ENTRADA_INICIAL') {
        ultimaDescricao = `Entrada inicial - ${Number(ultima.quantidadeSacas).toLocaleString('pt-BR')} sacas`
    }

    return {
        colheitaId: colheita.id,
        lote: codigoLote,
        ano: colheita.ano,
        dataColheita: colheita.data_colheita,
        fazenda: colheita.fazendas
            ? {
                  id: colheita.fazendas.id,
                  nome: colheita.fazendas.nome,
                  localizacao: colheita.fazendas.localizacao ?? null,
              }
            : null,
        cultura: colheita.culturas
            ? {
                  id: colheita.culturas.id,
                  nome: colheita.culturas.nome,
                  cor: colheita.culturas.cor,
              }
            : null,
        produzidas,
        vendidas,
        emEstoque,
        localizacao: colheita.fazendas?.localizacao ?? '—',
        ultimaMovimentacao: ultima
            ? {
                  data: formatarData(ultima.data),
                  descricao: ultimaDescricao,
              }
            : null,
        status: calcularStatus(emEstoque, produzidas),
        movimentacoes,
    }
}

function filtrarPorBusca(rows, busca) {
    if (!busca) return rows
    return rows.filter((row) => {
        const alvo = [
            row.lote,
            row.fazenda?.nome,
            row.cultura?.nome,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
        return alvo.includes(busca)
    })
}

function calcularResumo(rows) {
    const totalEmEstoque = rows.reduce((acc, r) => acc + r.emEstoque, 0)
    const totalVendido = rows.reduce((acc, r) => acc + r.vendidas, 0)
    const lotesEstoqueBaixo = rows.filter((r) => r.status === 'ESTOQUE_BAIXO').length

    return { totalEmEstoque, totalVendido, lotesEstoqueBaixo }
}

function extrairMovimentacoesRecentes(rows, limite = 6) {
    const todas = rows.flatMap((row) =>
        (row.movimentacoes ?? [])
            .filter((m) => m.tipo === 'VENDA')
            .map((m) => ({
                ...m,
                lote: row.lote,
                fazendaNome: row.fazenda?.nome,
            })),
    )

    return todas
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, limite)
        .map((m) => ({
            id: m.id,
            tipo: m.tipo,
            lote: m.lote,
            fazendaNome: m.fazendaNome,
            data: formatarData(m.data),
            dataHora: m.dataHora,
            quantidadeSacas: m.quantidadeSacas,
            descricao: m.descricao,
        }))
}

async function resolveFazendasPermitidas({ usuarioId, role }) {
    if (role === 'ADMIN') return []
    const ids = await usuarioRepository.buscarIdsFazendasVinculadas(usuarioId)
    if (!ids.length) {
        throw new AppError('Funcionario sem fazendas vinculadas', 422)
    }
    return ids
}

async function buildRows({ filtros, role, fazendasPermitidas }) {
    const colheitas = await estoqueRepository.buscarColheitasComLucros({
        fazendaId: filtros.fazendaId,
        culturaId: filtros.culturaId,
        colheitaId: filtros.colheitaId,
        role,
        fazendasPermitidas,
    })

    const codigos = gerarCodigosLote(colheitas)
    const rows = colheitas.map((c) => montarLoteRow(c, codigos.get(c.id) ?? `LOTE-${c.ano}`))
    return filtrarPorBusca(rows, filtros.busca)
}

export const estoqueService = {
    listar: async ({ usuarioId, role, query }) => {
        const fazendasPermitidas = await resolveFazendasPermitidas({ usuarioId, role })
        const filtros = normalizeFiltros({ query, role })
        const page = query.page ?? 1
        const pageSize = query.pageSize ?? 5

        const rows = await buildRows({ filtros, role, fazendasPermitidas })
        const resumo = calcularResumo(rows)
        const movimentacoesRecentes = extrairMovimentacoesRecentes(rows)

        const totalItems = rows.length
        const skip = (page - 1) * pageSize
        const items = rows.slice(skip, skip + pageSize)

        return {
            items,
            resumo,
            movimentacoesRecentes,
            meta: {
                page,
                pageSize,
                totalItems,
                totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
            },
        }
    },

    buscarResumo: async ({ usuarioId, role, query }) => {
        const fazendasPermitidas = await resolveFazendasPermitidas({ usuarioId, role })
        const filtros = normalizeFiltros({ query, role })
        const rows = await buildRows({ filtros, role, fazendasPermitidas })
        return {
            resumo: calcularResumo(rows),
            movimentacoesRecentes: extrairMovimentacoesRecentes(rows),
        }
    },

    buscarDetalhe: async ({ usuarioId, role, colheitaId }) => {
        const fazendasPermitidas = await resolveFazendasPermitidas({ usuarioId, role })
        const colheita = await estoqueRepository.buscarColheitaPorId(colheitaId)

        if (!colheita) {
            throw new AppError('Colheita nao encontrada', 404)
        }

        if (role === 'FUNCIONARIO' && !fazendasPermitidas.includes(colheita.fazenda_id)) {
            throw new AppError('Acesso negado: colheita fora do escopo do usuario', 403)
        }

        const doMesmoGrupo = await estoqueRepository.buscarColheitasComLucros({
            culturaId: colheita.cultura_id,
            role: 'ADMIN',
            fazendasPermitidas: [],
        })
        const doAno = doMesmoGrupo.filter((c) => c.ano === colheita.ano)
        const codigos = gerarCodigosLote(doAno.length ? doAno : [colheita])
        const detalhe = montarLoteRow(colheita, codigos.get(colheita.id) ?? `LOTE-${colheita.ano}`)

        return detalhe
    },
}
