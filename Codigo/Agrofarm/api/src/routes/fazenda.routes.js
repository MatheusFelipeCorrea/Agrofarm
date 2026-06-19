import { Router } from 'express'
import { fazendaController } from '../controllers/fazenda.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/role.middleware.js'
import { validate } from '../middlewares/validator.middleware.js'
import { createFazendaSchema, updateFazendaSchema } from '../schemas/fazenda.schema.js'
import { fazendaCulturaController } from '../controllers/fazendaCultura.controller.js'
import { poligonoHistoricoController } from '../controllers/poligonoHistorico.controller.js'
import { createFazendaCulturaSchema, updateFazendaCulturaSchema } from '../schemas/fazendaCultura.schema.js'

const router = Router()

router.use(authMiddleware)

router.get('/', fazendaController.getAll)
router.get('/:id/detalhe', fazendaController.getDetalhe)
router.get('/:id', fazendaController.getPorId)
router.post('/', authorize('ADMIN'), validate(createFazendaSchema), fazendaController.create)
router.put('/:id', authorize('ADMIN'), validate(updateFazendaSchema), fazendaController.update)
router.delete('/:id', authorize('ADMIN'), fazendaController.delete)

// Culturas vinculadas à fazenda (fazenda_culturas)
router.get('/:fazendaId/culturas', fazendaCulturaController.getPorFazenda)
router.post('/:fazendaId/culturas', validate(createFazendaCulturaSchema), fazendaCulturaController.create)
router.put('/:fazendaId/culturas/:id', validate(updateFazendaCulturaSchema), fazendaCulturaController.update)
router.delete('/:fazendaId/culturas/:id', fazendaCulturaController.delete)

// Histórico de mapas (talhões removidos do mapa principal)
router.get('/:fazendaId/historico-mapa', poligonoHistoricoController.listar)
router.get('/:fazendaId/historico-mapa/:historicoId', poligonoHistoricoController.buscarPorId)
router.post(
    '/:fazendaId/historico-mapa/:historicoId/restaurar',
    authorize('ADMIN'),
    poligonoHistoricoController.restaurar,
)

export { router as fazendaRoutes }
