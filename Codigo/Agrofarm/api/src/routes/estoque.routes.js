import { Router } from 'express'
import { estoqueController } from '../controllers/estoque.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validator } from '../middlewares/validator.middleware.js'
import { estoqueColheitaParamsSchema, listarEstoqueQuerySchema } from '../schemas/estoque.schema.js'

const router = Router()

router.use(authMiddleware)

router.get('/', validator({ query: listarEstoqueQuerySchema }), estoqueController.listar)
router.get('/resumo', validator({ query: listarEstoqueQuerySchema }), estoqueController.getResumo)
router.get(
    '/:colheitaId',
    validator({ params: estoqueColheitaParamsSchema }),
    estoqueController.getDetalhe,
)

export { router as estoqueRoutes }
