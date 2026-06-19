import { lucroService } from '../services/lucro.service.js'
import { lucroView } from '../views/lucro.view.js'

async function getAll(req, res, next) {
    try {
        const result = await lucroService.listar({
            usuarioId: req.usuario?.id,
            role: req.usuario?.role,
            query: req.query,
        })

        res.json({
            status: 'success',
            data: {
                items: lucroView.renderMany(result.items),
                meta: result.meta,
            },
        })
    } catch (error) {
        next(error)
    }
}

async function getTotal(req, res, next) {
    try {
        const total = await lucroService.buscarTotal({
            usuarioId: req.usuario?.id,
            role: req.usuario?.role,
            query: req.query,
        })

        res.json({
            status: 'success',
            data: lucroView.renderTotal(total),
        })
    } catch (error) {
        next(error)
    }
}

async function getPorColheita(req, res, next) {
    try {
        const lucros = await lucroService.buscarPorColheita({
            usuarioId: req.usuario?.id,
            role: req.usuario?.role,
            colheitaId: req.params.colheitaId,
        })
        res.json({
            status: 'success',
            data: lucroView.renderMany(lucros),
        })
    } catch (error) {
        next(error)
    }
}

async function create(req, res, next) {
    try {
        const lucro = await lucroService.criar({
            usuarioId: req.usuario?.id,
            role: req.usuario?.role,
            payload: req.body,
        })

        res.status(201).json({
            status: 'success',
            data: lucroView.render(lucro),
        })
    } catch (error) {
        next(error)
    }
}

async function update(req, res, next) {
    try {
        const lucro = await lucroService.atualizar({
            usuarioId: req.usuario?.id,
            role: req.usuario?.role,
            id: req.params.id,
            payload: req.body,
        })

        res.json({
            status: 'success',
            data: lucroView.render(lucro),
        })
    } catch (error) {
        next(error)
    }
}

async function deleteLucro(req, res, next) {
    try {
        await lucroService.deletar({
            usuarioId: req.usuario?.id,
            role: req.usuario?.role,
            id: req.params.id,
        })

        res.status(204).send()
    } catch (error) {
        next(error)
    }
}

async function marcarRecebimentoArrendamento(req, res, next) {
    try {
        const lucro = await lucroService.marcarRecebimentoArrendamento({
            role: req.usuario?.role,
            id: req.params.id,
            status: req.body.status,
        })

        res.json({
            status: 'success',
            data: lucroView.render(lucro),
        })
    } catch (error) {
        next(error)
    }
}

export const lucroController = {
    getAll,
    getTotal,
    getPorColheita,
    create,
    update,
    marcarRecebimentoArrendamento,
    delete: deleteLucro,
}
