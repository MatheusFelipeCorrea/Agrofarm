import { z } from 'zod'

const fazendaIdsSchema = z.array(z.string().uuid('Fazenda inválida')).default([])

// Telefone BR: 10 (fixo com DDD) a 13 dígitos (com +55 e celular de 9 dígitos).
export function telefoneBrValido(valor) {
    const digitos = String(valor ?? '').replace(/\D/g, '')
    return digitos.length >= 10 && digitos.length <= 13
}

export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export const cadastroSchema = z
    .object({
        nome: z.string().min(1, 'Nome é obrigatório'),
        email: z.string().email('Email inválido'),
        role: z.enum(['ADMIN', 'FUNCIONARIO']).default('FUNCIONARIO'),
        telefone: z
            .string()
            .trim()
            .min(1, 'Telefone inválido')
            .refine(telefoneBrValido, 'Telefone inválido (informe DDD + número)')
            .optional(),
        fazendaIds: fazendaIdsSchema.optional(),
    })
    .strict()
    .superRefine((dados, ctx) => {
        if (dados.role === 'FUNCIONARIO' && (!dados.fazendaIds || dados.fazendaIds.length < 1)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Funcionario deve possuir ao menos uma fazenda vinculada',
                path: ['fazendaIds'],
            })
        }
    })

export const esqueciSenhaSchema = z.object({
    email: z.string().email('Email inválido'),
})

export const redefinirSenhaSchema = z.object({
    token: z.string().min(1, 'Token é obrigatório'),
    novaSenha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

export const changeInitialPasswordSchema = z
    .object({
        userId: z.string().uuid('Usuario invalido'),
        oldPassword: z.string().min(1, 'Senha atual e obrigatoria'),
        newPassword: z.string().min(8, 'Nova senha deve ter no minimo 8 caracteres'),
        confirmNewPassword: z.string().min(8, 'Confirmacao de senha e obrigatoria'),
    })
    .refine((dados) => dados.newPassword === dados.confirmNewPassword, {
        message: 'Nova senha e confirmacao devem ser iguais',
        path: ['confirmNewPassword'],
    })

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Senha atual e obrigatoria'),
        newPassword: z.string().min(8, 'Nova senha deve ter no minimo 8 caracteres'),
        confirmNewPassword: z.string().min(8, 'Confirmacao de senha e obrigatoria'),
    })
    .refine((dados) => dados.newPassword === dados.confirmNewPassword, {
        message: 'Nova senha e confirmacao devem ser iguais',
        path: ['confirmNewPassword'],
    })