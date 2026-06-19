import { AppError } from '../shared/errors/AppError.js'

export const authorize =
    (...roles) =>
    (req, res, next) => {
        if (!req.usuario || !roles.includes(req.usuario.role)) {
            return next(new AppError('Acesso negado: permissão insuficiente', 403))
        }
        next()
    }
