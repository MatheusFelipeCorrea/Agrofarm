import { authService } from '../services/auth.service.js'
import { usuarioView } from '../views/usuario.view.js'

export const authController = {
    login: async (req, res, next) => {
        try {
            const resultado = await authService.login(req.body)

            if (resultado.requirePasswordChange) {
                return res.status(403).json({
                    requirePasswordChange: true,
                    userId: resultado.userId,
                    message: 'E necessario definir uma nova senha antes de acessar o sistema',
                })
            }

            const { token, usuario, menu } = resultado

            return res.status(200).json({
                token,
                usuario: usuarioView.render(usuario),
                menu,
            })
        } catch (error) {
            next(error)
        }
    },

    me: async (req, res, next) => {
        try {
            const { usuario, menu } = await authService.obterSessaoAtual(req.usuario)

            return res.status(200).json({
                usuario: usuarioView.render(usuario),
                menu,
            })
        } catch (error) {
            next(error)
        }
    },

    cadastro: async (req, res, next) => {
        try {
            const usuario = await authService.cadastro(req.body)

            return res.status(201).json({
                usuario: usuarioView.render(usuario),
            })
        } catch (error) {
            next(error)
        }
    },

    logout: async (req, res) => {
        return res.status(200).json({
            message: 'Logout realizado com sucesso',
        })
    },

    esqueciSenha: async (req, res, next) => {
        try {
            await authService.esqueciSenha(req.body)

            return res.status(200).json({
                message: 'Se o email estiver cadastrado, você receberá o link em breve',
            })
        } catch (error) {
            next(error)
        }
    },

    redefinirSenha: async (req, res, next) => {
        try {
            await authService.redefinirSenha(req.body)

            return res.status(200).json({
                message: 'Senha redefinida com sucesso',
            })
        } catch (error) {
            next(error)
        }
    },

    changeInitialPassword: async (req, res, next) => {
        try {
            const { token, usuario, menu } = await authService.changeInitialPassword(req.body)

            return res.status(200).json({
                token,
                usuario: usuarioView.render(usuario),
                menu,
            })
        } catch (error) {
            next(error)
        }
    },
}