import { estoqueService } from '../services/estoque.service.js'
import { estoqueView } from '../views/estoque.view.js'

async function listar(req, res, next) {
    try {
        const result = await estoqueService.listar({
            usuarioId: req.usuario?.id,
            role: req.usuario?.role,
            query: req.query,
        })

        res.json({
            status: 'success',
            data: {
                items: estoqueView.renderMany(result.items),
                resumo: estoqueView.renderResumo(result.resumo),
                movimentacoesRecentes: estoqueView.renderMovimentacoesRecentes(result.movimentacoesRecentes),
                arrendamentosPendentes: estoqueView.renderArrendamentosPendentes(result.arrendamentosPendentes),
                meta: result.meta,
            },
        })
    } catch (error) {
        next(error)
    }
}

async function getResumo(req, res, next) {
    try {
        const result = await estoqueService.buscarResumo({
            usuarioId: req.usuario?.id,
            role: req.usuario?.role,
            query: req.query,
        })

        res.json({
            status: 'success',
            data: {
                resumo: estoqueView.renderResumo(result.resumo),
                movimentacoesRecentes: estoqueView.renderMovimentacoesRecentes(result.movimentacoesRecentes),
            },
        })
    } catch (error) {
        next(error)
    }
}

async function getDetalhe(req, res, next) {
    try {
        const detalhe = await estoqueService.buscarDetalhe({
            usuarioId: req.usuario?.id,
            role: req.usuario?.role,
            colheitaId: req.params.colheitaId,
        })

        res.json({
            status: 'success',
            data: estoqueView.renderDetalhe(detalhe),
        })
    } catch (error) {
        next(error)
    }
}

async function listarArrendamentosPendentes(req, res, next) {
    try {
        const result = await estoqueService.listarArrendamentosPendentes({
            role: req.usuario?.role,
            query: req.query,
        })

        res.json({
            status: 'success',
            data: {
                items: estoqueView.renderArrendamentosPendentes(result.items),
                meta: result.meta,
            },
        })
    } catch (error) {
        next(error)
    }
}

async function confirmarArrendamento(req, res, next) {
    try {
        const entrega = await estoqueService.confirmarEntregaArrendamento({
            role: req.usuario?.role,
            entregaId: req.params.entregaId,
            colheitaId: req.body.colheitaId,
        })

        res.json({
            status: 'success',
            data: estoqueView.renderEntregaArrendamento(entrega),
        })
    } catch (error) {
        next(error)
    }
}

async function marcarEntregaArrendamento(req, res, next) {
    try {
        const entrega = await estoqueService.marcarEntregaArrendamento({
            role: req.usuario?.role,
            entregaId: req.params.entregaId,
            status: req.body.status,
        })

        res.json({
            status: 'success',
            data: estoqueView.renderEntregaArrendamento(entrega),
        })
    } catch (error) {
        next(error)
    }
}

export const estoqueController = {
    listar,
    getResumo,
    getDetalhe,
    listarArrendamentosPendentes,
    confirmarArrendamento,
    marcarEntregaArrendamento,
}
