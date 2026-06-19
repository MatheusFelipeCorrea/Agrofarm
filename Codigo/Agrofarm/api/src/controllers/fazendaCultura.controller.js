import { fazendaCulturaService } from '../services/fazendaCultura.service.js'
import { fazendaCulturaView } from '../views/fazendaCultura.view.js'

export const fazendaCulturaController = {
    getPorFazenda: async (req, res, next) => {
        try {
            const { fazendaId } = req.params
            const vinculos = await fazendaCulturaService.listarPorFazenda(fazendaId, req.usuario)
            return res.status(200).json({ culturas: fazendaCulturaView.renderMany(vinculos) })
        } catch (error) {
            next(error)
        }
    },

    create: async (req, res, next) => {
        try {
            const { fazendaId } = req.params
            const vinculo = await fazendaCulturaService.criar(fazendaId, req.body, req.usuario)
            return res.status(201).json({
                vinculo: fazendaCulturaView.render(vinculo),
                cultura: fazendaCulturaView.render(vinculo),
            })
        } catch (error) {
            next(error)
        }
    },

    update: async (req, res, next) => {
        try {
            const { fazendaId, id } = req.params
            const vinculo = await fazendaCulturaService.atualizar(fazendaId, id, req.body, req.usuario)
            return res.status(200).json({
                vinculo: fazendaCulturaView.render(vinculo),
                cultura: fazendaCulturaView.render(vinculo),
            })
        } catch (error) {
            next(error)
        }
    },

    delete: async (req, res, next) => {
        try {
            const { fazendaId, id } = req.params
            await fazendaCulturaService.deletar(fazendaId, id, req.usuario)
            return res.status(204).send()
        } catch (error) {
            next(error)
        }
    },
}

