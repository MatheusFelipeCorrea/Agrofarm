import { AppError } from '../shared/errors/AppError.js'
import { poligonoHistoricoRepository } from '../repositories/poligonoHistorico.repository.js'
import { poligonoService } from './poligono.service.js'
import { fazendaCulturaService } from './fazendaCultura.service.js'
import { fazendaRepository } from '../repositories/fazenda.repository.js'
import { isCulturaCafe } from '../shared/cultura/culturaStatus.js'

const ADMIN = 'ADMIN'

/**
 * Garante registro em colheitas quando o talhão é arquivado com data de colheita.
 * Vários talhões da mesma cultura na mesma data agregam a área quando a colheita
 * ainda não teve sacas informadas (origem automática do mapa).
 */
async function garantirColheitaDoMapa(poligono) {
    if (!poligono.cultura_id || !poligono.data_colheita) return null

    const dataColheita = new Date(poligono.data_colheita)
    const areaTalhao = Number(poligono.area_hectares ?? 0)

    const existente = await poligonoHistoricoRepository.buscarColheitaPorFazendaCulturaData(
        poligono.fazenda_id,
        poligono.cultura_id,
        dataColheita,
    )

    if (existente) {
        const sacas = Number(existente.sacas_produzidas ?? 0)
        if (sacas === 0 && areaTalhao > 0) {
            const novaArea = Number(existente.area ?? 0) + areaTalhao
            return poligonoHistoricoRepository.atualizarAreaColheita(existente.id, novaArea)
        }
        return existente
    }

    return poligonoHistoricoRepository.criarColheitaDoMapa({
        fazenda_id: poligono.fazenda_id,
        cultura_id: poligono.cultura_id,
        data_colheita: dataColheita,
        ano: dataColheita.getFullYear(),
        area: areaTalhao,
    })
}

/**
 * Define o status do registro de histórico e tenta vincular a colheita/safra
 * correspondente. Com data de colheita no talhão, cria ou reutiliza o registro
 * em colheitas para alimentar a tela de colheitas e o dashboard.
 */
async function resolverContextoArquivamento(poligono) {
    let status = 'ARQUIVADA'
    let colheita_id = null
    let data_colheita = poligono.data_colheita ?? null

    if (poligono.cultura_id) {
        let colheita = null

        if (data_colheita) {
            colheita = await garantirColheitaDoMapa(poligono)
        } else {
            colheita = await poligonoHistoricoRepository.buscarUltimaColheita(
                poligono.fazenda_id,
                poligono.cultura_id,
            )
        }

        if (colheita) {
            status = 'COLHIDA'
            colheita_id = colheita.id
            if (!data_colheita) data_colheita = colheita.data_colheita
        } else {
            status = 'ENCERRADA'
        }
    }

    return { status, colheita_id, data_colheita }
}

async function garantirAcessoFazenda(usuario, fazendaId) {
    const fazenda = await fazendaRepository.buscarPorId(fazendaId)
    if (!fazenda) {
        throw new AppError('Fazenda não encontrada', 404)
    }
    if (usuario.role === ADMIN) {
        return fazenda
    }
    const permitido = await fazendaRepository.usuarioTemVinculo(usuario.id, fazendaId)
    if (!permitido) {
        throw new AppError('Acesso negado a esta fazenda', 403)
    }
    return fazenda
}

function formatSafra(ano) {
    if (ano == null) return null
    const n = Number(ano)
    if (!Number.isFinite(n)) return null
    return `Safra ${n}`
}

function calcularProdutividade(item) {
    const area = Number(item.colheita_area ?? item.area_hectares ?? 0)
    const sacas = Number(item.sacas_produzidas ?? 0)
    if (area <= 0 || sacas <= 0) return null
    return Number((sacas / area).toFixed(2))
}

function mapItem(item) {
    const area = Number(item.area_hectares ?? 0)
    const produtividade = calcularProdutividade(item)
    return {
        id: item.id,
        fazendaId: item.fazenda_id,
        poligonoIdOrigem: item.poligono_id_origem,
        nome: item.nome,
        culturaId: item.cultura_id,
        culturaNome: item.cultura_nome,
        culturaCor: item.cultura_cor,
        colheitaId: item.colheita_id,
        safra: formatSafra(item.safra_ano),
        dataPlantio: item.data_plantio,
        dataColheita: item.data_colheita,
        areaHectares: area,
        geometria: item.geometria,
        status: item.status,
        arquivadoEm: item.arquivado_em,
        restauradoEm: item.restaurado_em,
        produtividadeScHa: produtividade,
    }
}

export const poligonoHistoricoService = {
    async arquivarPoligonoExcluido(poligono) {
        const contexto = await resolverContextoArquivamento(poligono)
        return poligonoHistoricoRepository.arquivar(poligono, contexto)
    },

    /**
     * Processa talhões cuja data de colheita já passou (a partir do dia seguinte).
     *
     * - Culturas anuais: a área é arquivada no histórico e removida do mapa.
     * - Café (perene): a safra é registrada no histórico, mas o talhão permanece
     *   no mapa e tem a data de colheita zerada, renovando o ciclo para a próxima
     *   safra (o usuário deverá informar a nova data de colheita).
     */
    async processarColheitasVencidas(fazendaId = null) {
        const vencidos = await poligonoHistoricoRepository.listarColheitasVencidas(fazendaId)
        let arquivados = 0
        let renovados = 0

        for (const poligono of vencidos) {
            const contexto = await resolverContextoArquivamento(poligono)
            await poligonoHistoricoRepository.arquivar(poligono, contexto)

            if (isCulturaCafe(poligono.cultura_nome)) {
                await poligonoHistoricoRepository.limparDataColheita(poligono.id)
                renovados += 1
            } else {
                await poligonoService.deletar(poligono.id)
                if (poligono.cultura_id) {
                    await fazendaCulturaService.sincronizarHectaresVinculo(
                        poligono.fazenda_id,
                        poligono.cultura_id,
                    )
                }
                arquivados += 1
            }
        }

        return { processados: vencidos.length, arquivados, renovados }
    },

    async listar(fazendaId, usuario, filtros = {}) {
        await garantirAcessoFazenda(usuario, fazendaId)
        const itens = await poligonoHistoricoRepository.listarPorFazenda(fazendaId, filtros)
        const kpisRaw = await poligonoHistoricoRepository.calcularKpis(fazendaId)
        return {
            itens: itens.map(mapItem),
            kpis: {
                mapasHistoricos: Number(kpisRaw?.mapas_historicos ?? 0),
                areasColhidas: Number(kpisRaw?.areas_colhidas ?? 0),
                hectaresNoHistorico: Number(kpisRaw?.hectares_no_historico ?? 0),
                rotacoesRegistradas: Number(kpisRaw?.rotacoes_registradas ?? 0),
            },
        }
    },

    async buscarPorId(historicoId, usuario) {
        const item = await poligonoHistoricoRepository.buscarPorId(historicoId)
        if (!item) {
            throw new AppError('Registro de histórico não encontrado', 404)
        }
        await garantirAcessoFazenda(usuario, item.fazenda_id)
        return mapItem(item)
    },

    async restaurar(fazendaId, historicoId, usuarioId) {
        const item = await poligonoHistoricoRepository.buscarPorId(historicoId)
        if (!item) {
            throw new AppError('Registro de histórico não encontrado', 404)
        }
        if (item.fazenda_id !== fazendaId) {
            throw new AppError('Registro não pertence a esta fazenda', 400)
        }
        if (item.restaurado_em) {
            throw new AppError('Esta área já foi restaurada no mapa', 400)
        }

        const poligono = await poligonoService.criar({
            fazenda_id: fazendaId,
            nome: item.nome,
            geojson: { type: 'Feature', geometry: item.geometria },
            area_hectares: Number(item.area_hectares),
            cultura_id: item.cultura_id,
            data_plantio: item.data_plantio,
            criado_por: usuarioId,
        })

        await poligonoHistoricoRepository.marcarRestaurado(historicoId)

        if (item.cultura_id) {
            await fazendaCulturaService.sincronizarHectaresVinculo(fazendaId, item.cultura_id)
        }

        return poligono
    },

    async contarAreasNoHistorico(fazendaId) {
        return poligonoHistoricoRepository.contarAtivos(fazendaId)
    },
}
