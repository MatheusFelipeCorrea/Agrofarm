import { AppError } from '../shared/errors/AppError.js'
import { assertFazendaOperavelPorId } from '../shared/fazenda/fazendaOperacao.js'
import { poligonoHistoricoService } from '../services/poligonoHistorico.service.js'

export const poligonoHistoricoController = {
    async listar(req, res, next) {
        try {
            const { fazendaId } = req.params
            const { culturaId, status, q } = req.query
            const resultado = await poligonoHistoricoService.listar(fazendaId, req.usuario, {
                culturaId: culturaId || null,
                status: status || null,
                q: q?.trim() || null,
            })
            res.json({ status: 'success', data: resultado })
        } catch (error) {
            next(error)
        }
    },

    async buscarPorId(req, res, next) {
        try {
            const { fazendaId, historicoId } = req.params
            const item = await poligonoHistoricoService.buscarPorId(historicoId, req.usuario)
            if (item.fazendaId !== fazendaId) {
                throw new AppError('Registro não pertence a esta fazenda', 400)
            }
            res.json({ status: 'success', data: item })
        } catch (error) {
            next(error)
        }
    },

    async restaurar(req, res, next) {
        try {
            const { fazendaId, historicoId } = req.params
            await assertFazendaOperavelPorId(fazendaId)
            const poligono = await poligonoHistoricoService.restaurar(
                fazendaId,
                historicoId,
                req.usuario?.id,
            )
            res.json({
                status: 'success',
                data: poligono,
                message: 'Área restaurada no mapa com sucesso',
            })
        } catch (error) {
            next(error)
        }
    },
}
