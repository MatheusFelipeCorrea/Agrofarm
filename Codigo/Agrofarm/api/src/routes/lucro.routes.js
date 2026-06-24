import { Router } from 'express'
import { z } from 'zod'
import { lucroController } from '../controllers/lucro.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { validator } from '../middlewares/validator.middleware.js'
import { idSchema } from '../schemas/common.schema.js'
import {
    createLucroSchema,
    lucroFiltroSchema,
    updateLucroSchema,
} from '../schemas/lucro.schema.js'

const colheitaIdParamsSchema = z.object({ colheitaId: z.string().uuid('colheitaId inválido') })

const router = Router()

router.use(authMiddleware)

router.get('/', validator({ query: lucroFiltroSchema }), lucroController.getAll)
router.get('/total', validator({ query: lucroFiltroSchema }), lucroController.getTotal)
router.get('/colheita/:colheitaId', validator({ params: colheitaIdParamsSchema }), lucroController.getPorColheita)
router.post('/', validator({ body: createLucroSchema }), lucroController.create)
router.put('/:id', validator({ params: idSchema, body: updateLucroSchema }), lucroController.update)
router.delete('/:id', validator({ params: idSchema }), lucroController.delete)

export { router as lucroRoutes }
