import { usuarioService } from '../services/usuario.service.js'
import { usuarioView } from '../views/usuario.view.js'

export const usuarioController = {
    getAll: async (req, res, next) => {
        try {
            const usuarios = await usuarioService.listarTodos()

            return res.status(200).json({
                usuarios: usuarioView.renderMany(usuarios),
            })
        } catch (error) {
            next(error)
        }
    },

    getPorId: async (req, res, next) => {
        try {
            const { id } = req.params
            const usuario = await usuarioService.buscarPorId(id)

            return res.status(200).json({
                usuario: usuarioView.render(usuario),
            })
        } catch (error) {
            next(error)
        }
    },

    update: async (req, res, next) => {
        try {
            const { id } = req.params
            const usuario = await usuarioService.atualizar(id, req.body)

            return res.status(200).json({
                usuario: usuarioView.render(usuario),
            })
        } catch (error) {
            next(error)
        }
    },

    delete: async (req, res, next) => {
        try {
            const { id } = req.params
            const usuarioLogadoId = req.usuario.id

            await usuarioService.deletar(id, usuarioLogadoId)

            return res.status(204).send()
        } catch (error) {
            next(error)
        }
    },
}
