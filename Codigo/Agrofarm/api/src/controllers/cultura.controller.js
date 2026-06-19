import { culturaService } from '../services/cultura.service.js'
import { culturaView } from '../views/cultura.view.js'

export const culturaController = {
    getAll: async (req, res, next) => {
        try {
            const culturas = await culturaService.listarTodas()
            return res.status(200).json({ culturas: culturaView.renderMany(culturas) })
        } catch (error) {
            next(error)
        }
    },

    create: async (req, res, next) => {
        try {
            const cultura = await culturaService.criar(req.body)
            return res.status(201).json({ cultura: culturaView.render(cultura) })
        } catch (error) {
            next(error)
        }
    },

    update: async (req, res, next) => {
        try {
            const { id } = req.params
            const cultura = await culturaService.atualizar(id, req.body)
            return res.status(200).json({ cultura: culturaView.render(cultura) })
        } catch (error) {
            next(error)
        }
    },

    delete: async (req, res, next) => {
        try {
            const { id } = req.params
            await culturaService.deletar(id)
            return res.status(204).send()
        } catch (error) {
            next(error)
        }
    },
}
