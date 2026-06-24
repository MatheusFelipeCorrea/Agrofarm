import { AppError } from '../shared/errors/AppError.js'
import { assertFazendaOperavelPorId } from '../shared/fazenda/fazendaOperacao.js'
import { geometryService } from '../services/geometry.service.js'
import { poligonoService } from '../services/poligono.service.js'
import { resolverNomeTalhao } from '../shared/poligono/poligonoNome.js'
import { validarDatasPoligono } from '../shared/poligono/poligonoDatas.js'
import { fazendaCulturaService } from '../services/fazendaCultura.service.js'
import { poligonoHistoricoService } from '../services/poligonoHistorico.service.js'
import { logger } from '../shared/utils/logger.js'

async function sincronizarCulturasDoTalhao(fazendaId, culturaIds = []) {
    const ids = [...new Set(culturaIds.filter(Boolean))]
    await Promise.all(ids.map((culturaId) => fazendaCulturaService.sincronizarHectaresVinculo(fazendaId, culturaId)))
}

export const poligonoController = {
    async listar(req, res, next) {
        try {
            const { fazendaId } = req.query
            if (!fazendaId) {
                throw new AppError('fazendaId é obrigatório', 400)
            }

            // Arquiva na hora os talhões cuja data de colheita já passou (anuais saem
            // do mapa; café renova o ciclo), garantindo que a listagem reflita o estado
            // correto sem depender do job diário.
            let arquivamento = { processados: 0 }
            try {
                arquivamento = await poligonoHistoricoService.processarColheitasVencidas(fazendaId)
            } catch (erro) {
                logger.error({ err: erro, fazendaId }, 'Falha ao arquivar colheitas vencidas ao listar talhões')
            }

            const poligonos = await poligonoService.buscarPorFazenda(fazendaId)
            res.json({
                status: 'success',
                data: poligonos,
                meta: { colheitasArquivadas: arquivamento.processados ?? 0 },
            })
        } catch (error) {
            next(error)
        }
    },

    async buscarPorId(req, res, next) {
        try {
            const { id } = req.params
            const poligono = await poligonoService.buscarPorId(id)
            if (!poligono) {
                throw new AppError('Polígono não encontrado', 404)
            }
            res.json({ status: 'success', data: poligono })
        } catch (error) {
            next(error)
        }
    },

    async criar(req, res, next) {
        try {
            const { fazenda_id, nome, geojson, cultura_id, data_plantio, data_colheita } = req.body
            const usuario_id = req.usuario?.id

            if (!fazenda_id || !geojson) {
                throw new AppError('fazenda_id e geojson são obrigatórios', 400)
            }

            validarDatasPoligono({ data_plantio, data_colheita, obrigatorias: true })

            const nomeResolvido = await resolverNomeTalhao({ nome, cultura_id })
            if (!nomeResolvido) {
                throw new AppError('Informe o nome do talhão ou selecione a cultura plantada', 400)
            }

            await assertFazendaOperavelPorId(fazenda_id)

            if (geojson.geometry?.type !== 'Polygon' && geojson.type !== 'Polygon') {
                throw new AppError('geojson deve ser do tipo Polygon', 400)
            }

            const validacao = await geometryService.validarGeometria(geojson)
            if (!validacao.valido) {
                throw new AppError(`Geometria inválida: ${validacao.motivo}`, 400)
            }

            const sobreposicao = await poligonoService.verificarSobreposicao({ fazenda_id, geojson })
            if (sobreposicao) {
                throw new AppError(
                    `O talhão desenhado se sobrepõe ao talhão "${sobreposicao.nome}". Ajuste a área para não sobrepor outros talhões.`,
                    409,
                )
            }

            const area_hectares = geometryService.calcularAreaHectares(geojson)

            const poligono = await poligonoService.criar({
                fazenda_id,
                nome: nomeResolvido,
                geojson,
                area_hectares,
                cultura_id: cultura_id || null,
                data_plantio: data_plantio || null,
                data_colheita: data_colheita || null,
                criado_por: usuario_id,
            })

            await sincronizarCulturasDoTalhao(fazenda_id, [cultura_id])

            res.status(201).json({ status: 'success', data: poligono })
        } catch (error) {
            next(error)
        }
    },

    async atualizar(req, res, next) {
        try {
            const { id } = req.params
            const { nome, geojson, cultura_id, data_plantio, data_colheita } = req.body

            const existente = await poligonoService.buscarPorId(id)
            if (!existente) {
                throw new AppError('Polígono não encontrado', 404)
            }

            await assertFazendaOperavelPorId(existente.fazenda_id)

            validarDatasPoligono({
                data_plantio: data_plantio !== undefined ? data_plantio : existente.data_plantio,
                data_colheita: data_colheita !== undefined ? data_colheita : existente.data_colheita,
            })

            let area_hectares
            if (geojson) {
                if (geojson.geometry?.type !== 'Polygon' && geojson.type !== 'Polygon') {
                    throw new AppError('geojson deve ser do tipo Polygon', 400)
                }
                const validacao = await geometryService.validarGeometria(geojson)
                if (!validacao.valido) {
                    throw new AppError(`Geometria inválida: ${validacao.motivo}`, 400)
                }
                const sobreposicao = await poligonoService.verificarSobreposicao({
                    fazenda_id: existente.fazenda_id,
                    geojson,
                    ignorarId: id,
                })
                if (sobreposicao) {
                    throw new AppError(
                        `O talhão editado se sobrepõe ao talhão "${sobreposicao.nome}". Ajuste a área para não sobrepor outros talhões.`,
                        409,
                    )
                }
                area_hectares = geometryService.calcularAreaHectares(geojson)
            }

            let nomeAtualizado = nome !== undefined ? nome?.trim() : undefined
            if (nome !== undefined || cultura_id !== undefined) {
                nomeAtualizado = await resolverNomeTalhao({
                    nome: nomeAtualizado ?? existente.nome,
                    cultura_id: cultura_id !== undefined ? cultura_id : existente.cultura_id,
                })
                if (!nomeAtualizado) {
                    throw new AppError('Informe o nome do talhão ou selecione a cultura plantada', 400)
                }
            }

            const poligono = await poligonoService.atualizar(id, {
                nome: nomeAtualizado,
                geojson,
                area_hectares,
                cultura_id,
                data_plantio,
                data_colheita,
            })

            const culturaNova = cultura_id !== undefined ? cultura_id : existente.cultura_id
            await sincronizarCulturasDoTalhao(existente.fazenda_id, [existente.cultura_id, culturaNova])

            res.json({ status: 'success', data: poligono })
        } catch (error) {
            next(error)
        }
    },

    async deletar(req, res, next) {
        try {
            const { id } = req.params

            const existente = await poligonoService.buscarPorId(id)
            if (!existente) {
                throw new AppError('Polígono não encontrado', 404)
            }

            await assertFazendaOperavelPorId(existente.fazenda_id)

            await poligonoHistoricoService.arquivarPoligonoExcluido(existente)
            await poligonoService.deletar(id)
            await sincronizarCulturasDoTalhao(existente.fazenda_id, [existente.cultura_id])
            res.json({ status: 'success', message: 'Polígono excluído com sucesso' })
        } catch (error) {
            next(error)
        }
    },

    async exportar(req, res, next) {
        try {
            const { fazendaId } = req.body
            if (!fazendaId) {
                throw new AppError('fazendaId é obrigatório', 400)
            }

            const geojson = await poligonoService.exportarGeoJSON(fazendaId)

            res.setHeader('Content-Type', 'application/geo+json')
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="fazenda-${fazendaId}-${Date.now()}.geojson"`,
            )
            res.json(geojson)
        } catch (error) {
            next(error)
        }
    },

    async importar(req, res, next) {
        try {
            const { fazendaId, geojson } = req.body
            const usuario_id = req.usuario?.id

            if (!fazendaId || !geojson) {
                throw new AppError('fazendaId e geojson são obrigatórios', 400)
            }

            await assertFazendaOperavelPorId(fazendaId)

            const poligonos = await poligonoService.importarGeoJSON(fazendaId, geojson, usuario_id)

            res.status(201).json({
                status: 'success',
                data: poligonos,
                message: `${poligonos.length} polígono(s) importado(s) com sucesso`,
            })
        } catch (error) {
            next(error)
        }
    },
}
