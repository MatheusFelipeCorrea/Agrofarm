import { Router } from 'express'
import { usuarioController } from '../controllers/usuario.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/role.middleware.js'
import { validate } from '../middlewares/validator.middleware.js'
import { updateUsuarioSchema } from '../schemas/usuario.schema.js'

const router = Router()

router.use(authMiddleware)
router.use(authorize('ADMIN'))

router.get('/', usuarioController.getAll)
router.get('/:id', usuarioController.getPorId)
router.put('/:id', validate(updateUsuarioSchema), usuarioController.update)
router.delete('/:id', usuarioController.delete)

export { router as usuarioRoutes }
