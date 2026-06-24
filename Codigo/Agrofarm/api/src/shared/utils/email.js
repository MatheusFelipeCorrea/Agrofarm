import { Resend } from 'resend'
import { logger } from './logger.js'

/** URL pública do SPA. */
export function resolveWebAppBaseUrl() {
    const explicit = process.env.WEB_APP_URL?.trim()
    if (explicit) return explicit.replace(/\/$/, '')
    const firstOrigin = (process.env.CORS_ORIGIN ?? '').split(',')[0]?.trim()
    return (firstOrigin || 'http://localhost:5173').replace(/\/$/, '')
}

export function buildResetPasswordLink(token) {
    return `${resolveWebAppBaseUrl()}/redefinir-senha?token=${token}`
}

function getResend() {
    const key = process.env.RESEND_API_KEY
    if (!key?.trim()) return null
    return new Resend(key)
}

function resolveFromAddress() {
    const configured = process.env.RESEND_FROM?.trim()
    if (configured) return configured
    return 'AgroFarm <onboarding@resend.dev>'
}

export const enviarEmailRedefinicao = async (email, token) => {
    const link = buildResetPasswordLink(token)
    const resend = getResend()

    if (!resend) {
        logger.warn(
            { email, link },
            'RESEND_API_KEY não definida — e-mail de redefinição não enviado (link disponível em modo dev)',
        )
        return { enviado: false, link }
    }

    try {
        const { error } = await resend.emails.send({
            from: resolveFromAddress(),
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

        if (error) {
            logger.error({ email, link, err: error.message }, 'Falha ao enviar e-mail de redefinição via Resend')
            return { enviado: false, link }
        }

        logger.info({ email, link }, 'E-mail de redefinição enviado via Resend')
        return { enviado: true, link }
    } catch (error) {
        logger.error(
            { email, link, err: error?.message ?? String(error) },
            'Erro inesperado ao enviar e-mail de redefinição',
        )
        return { enviado: false, link }
    }
}
