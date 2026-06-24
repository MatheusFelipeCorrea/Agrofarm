import { Router } from 'express'
import { estoqueController } from '../controllers/estoque.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validator } from '../middlewares/validator.middleware.js'
import {
    confirmarArrendamentoSchema,
    entregaArrendamentoParamsSchema,
    estoqueColheitaParamsSchema,
    listarEstoqueQuerySchema,
    marcarEntregaArrendamentoSchema,
} from '../schemas/estoque.schema.js'

const router = Router()

router.use(authMiddleware)

router.get('/arrendamentos-pendentes', validator({ query: listarEstoqueQuerySchema }), estoqueController.listarArrendamentosPendentes)
router.patch(
    '/arrendamento/:entregaId/confirmar',
    validator({ params: entregaArrendamentoParamsSchema, body: confirmarArrendamentoSchema }),
    estoqueController.confirmarArrendamento,
)
router.patch(
    '/arrendamento/:entregaId/status',
    validator({ params: entregaArrendamentoParamsSchema, body: marcarEntregaArrendamentoSchema }),
    estoqueController.marcarEntregaArrendamento,
)
router.get('/', validator({ query: listarEstoqueQuerySchema }), estoqueController.listar)
router.get('/resumo', validator({ query: listarEstoqueQuerySchema }), estoqueController.getResumo)
router.get(
    '/:colheitaId',
    validator({ params: estoqueColheitaParamsSchema }),
    estoqueController.getDetalhe,
)

export { router as estoqueRoutes }
