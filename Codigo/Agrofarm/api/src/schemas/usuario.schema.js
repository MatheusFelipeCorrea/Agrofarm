import { z } from 'zod'
import { telefoneBrValido } from './auth.schema.js'

export const updateUsuarioSchema = z
    .object({
        nome: z.string().min(1, 'Nome não pode ser vazio').optional(),
        email: z.string().email('Email inválido').optional(),
        telefone: z
            .union([
                z
                    .string()
                    .trim()
                    .min(1, 'Telefone inválido')
                    .refine(telefoneBrValido, 'Telefone inválido (informe DDD + número)'),
                z.literal(''),
                z.null(),
            ])
            .optional()
            .transform((valor) => {
                if (valor === undefined) return undefined
                if (valor === '') return null
                return valor
            }),
        role: z
            .enum(['ADMIN', 'FUNCIONARIO'], {
                errorMap: () => ({ message: 'Role deve ser ADMIN ou FUNCIONARIO' }),
            })
            .optional(),
        resetPasswordToDefault: z.boolean().optional(),
        fazendaIds: z.array(z.string().uuid('Fazenda inválida')).optional(),
    })
    .strict()
    .superRefine((dados, ctx) => {
        if (
            dados.role === 'FUNCIONARIO' &&
            dados.fazendaIds !== undefined &&
            dados.fazendaIds.length < 1
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Funcionario deve possuir ao menos uma fazenda vinculada',
                path: ['fazendaIds'],
            })
        }
    })
