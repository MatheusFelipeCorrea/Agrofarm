import { Router } from 'express'
import { poligonoController } from '../controllers/poligono.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(authMiddleware)

router.get('/', poligonoController.listar)
router.get('/:id', poligonoController.buscarPorId)
router.post('/exportar', poligonoController.exportar)
router.post('/importar', poligonoController.importar)
router.post('/', poligonoController.criar)
router.put('/:id', poligonoController.atualizar)
router.delete('/:id', poligonoController.deletar)

export { router as poligonoRoutes }
