import { Resend } from 'resend'
import { logger } from './logger.js'

/** URL pública do SPA. */
export function resolveWebAppBaseUrl() {
    const explicit = process.env.WEB_APP_URL?.trim()
    if (explicit) return explicit.replace(/\/$/, '')
    const firstOrigin = (process.env.CORS_ORIGIN ?? '').split(',')[0]?.trim()
    return (firstOrigin || 'http://localhost:5173').replace(/\/$/, '')
}

function getResend() {
    const key = process.env.RESEND_API_KEY
    if (!key?.trim()) return null
    return new Resend(key)
}

export const enviarEmailRedefinicao = async (email, token) => {
    const resend = getResend()
    if (!resend) {
        logger.warn(
            { email },
            'RESEND_API_KEY não definida — e-mail de redefinição de senha não enviado (defina no .env para produção)',
        )
        return
    }

    const link = `${resolveWebAppBaseUrl()}/redefinir-senha?token=${token}`

    await resend.emails.send({
        from: 'AgroFarm <onboarding@resend.dev>',
        to: email,
        subject: 'Redefinição de senha — AgroFarm',
        html: `
    <h2>Redefinição de senha</h2>
    <p>Clique no link abaixo para redefinir sua senha:</p>
    <a href="${link}">${link}</a>
    <p>Este link expira em <strong>1 hora</strong>.</p>
    <p>Se você não solicitou, ignore este email.</p>
  `,
    })

    logger.info(`Email de redefinição enviado para ${email}`)
}