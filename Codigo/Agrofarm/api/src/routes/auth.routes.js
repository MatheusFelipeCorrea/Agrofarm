import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/role.middleware.js'
import { validate } from '../middlewares/validator.middleware.js'
import {
    loginSchema,
    cadastroSchema,
    esqueciSenhaSchema,
    redefinirSenhaSchema,
    changeInitialPasswordSchema,
    changePasswordSchema,
} from '../schemas/auth.schema.js'

const router = Router()

router.post('/login', validate(loginSchema), authController.login)
router.post(
    '/change-initial-password',
    validate(changeInitialPasswordSchema),
    authController.changeInitialPassword,
)
router.post('/cadastro', authMiddleware, authorize('ADMIN'), validate(cadastroSchema), authController.cadastro)
router.post('/logout', authController.logout)
router.get('/recuperacao-config', authController.recuperacaoConfig)
router.post('/esqueci-senha', validate(esqueciSenhaSchema), authController.esqueciSenha)
router.post('/redefinir-senha', validate(redefinirSenhaSchema), authController.redefinirSenha)
router.post(
    '/change-password',
    authMiddleware,
    validate(changePasswordSchema),
    authController.changePassword,
)
router.get('/me', authMiddleware, authController.me)

export { router as authRoutes }
