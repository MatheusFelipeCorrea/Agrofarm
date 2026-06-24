import { AppError } from '../errors/AppError.js'
import {
    DEFAULT_ADMIN_RESET_PASSWORD,
    MIN_NEW_PASSWORD_LENGTH,
} from '../constants/passwordDefaults.js'

export function isEmailConfigured() {
    return Boolean(process.env.RESEND_API_KEY?.trim())
}

export function assertNewPasswordValid(newPassword, confirmNewPassword) {
    if (newPassword !== confirmNewPassword) {
        throw new AppError('Nova senha e confirmacao devem ser iguais', 400)
    }

    if (newPassword.length < MIN_NEW_PASSWORD_LENGTH) {
        throw new AppError(`Nova senha deve ter no minimo ${MIN_NEW_PASSWORD_LENGTH} caracteres`, 400)
    }

    if (newPassword === DEFAULT_ADMIN_RESET_PASSWORD) {
        throw new AppError('A nova senha nao pode ser igual a senha padrao temporaria', 400)
    }
}
