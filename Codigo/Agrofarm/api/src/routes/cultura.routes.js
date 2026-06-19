import { Router } from 'express'
import { culturaController } from '../controllers/cultura.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/role.middleware.js'
import { validate } from '../middlewares/validator.middleware.js'
import { createCulturaSchema, updateCulturaSchema } from '../schemas/cultura.schema.js'

const router = Router()

router.use(authMiddleware)

router.get('/', culturaController.getAll)
router.post('/', authorize('ADMIN'), validate(createCulturaSchema), culturaController.create)
router.put('/:id', authorize('ADMIN'), validate(updateCulturaSchema), culturaController.update)
router.delete('/:id', authorize('ADMIN'), culturaController.delete)

export { router as culturaRoutes }
