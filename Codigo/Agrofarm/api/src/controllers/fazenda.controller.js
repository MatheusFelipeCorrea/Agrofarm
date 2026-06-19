import { fazendaService } from '../services/fazenda.service.js'
import { fazendaView } from '../views/fazenda.view.js'

export const fazendaController = {
    getAll: async (req, res, next) => {
        try {
            const { fazendas, hectaresPorFazenda } = await fazendaService.listarTodas(req.usuario)
            return res.status(200).json({
                fazendas: fazendaView.renderMany(fazendas, hectaresPorFazenda),
            })
        } catch (error) {
            next(error)
        }
    },

    getPorId: async (req, res, next) => {
        try {
            const { id } = req.params
            const { fazenda, hectaresMapeados } = await fazendaService.buscarPorId(id, req.usuario)
            return res.status(200).json({
                fazenda: fazendaView.render(fazenda, { hectaresMapeados }),
            })
        } catch (error) {
            next(error)
        }
    },

    getDetalhe: async (req, res, next) => {
        try {
            const { id } = req.params
            const detalhe = await fazendaService.buscarDetalhe(id, req.usuario)
            return res.status(200).json({
                fazenda: fazendaView.renderDetalhe(detalhe),
            })
        } catch (error) {
            next(error)
        }
    },

    create: async (req, res, next) => {
        try {
            const fazenda = await fazendaService.criar(req.body)
            return res.status(201).json({ fazenda: fazendaView.render(fazenda) })
        } catch (error) {
            next(error)
        }
    },

    update: async (req, res, next) => {
        try {
            const { id } = req.params
            const fazenda = await fazendaService.atualizar(id, req.body)
            return res.status(200).json({ fazenda: fazendaView.render(fazenda) })
        } catch (error) {
            next(error)
        }
    },

    delete: async (req, res, next) => {
        try {
            const { id } = req.params
            await fazendaService.deletar(id)
            return res.status(204).send()
        } catch (error) {
            next(error)
        }
    },
}
