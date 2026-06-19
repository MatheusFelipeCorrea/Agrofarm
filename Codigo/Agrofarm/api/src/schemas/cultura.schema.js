import { z } from 'zod'
import { HECTARES_MAX, HECTARES_MAX_MESSAGE } from '../shared/constants/hectares.js'

const hexColor = z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato HEX (#RRGGBB)')

const hectaresOptional = z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.coerce
        .number({ invalid_type_error: 'Hectares deve ser um número' })
        .min(0, 'Hectares não pode ser negativo')
        .max(HECTARES_MAX, HECTARES_MAX_MESSAGE)
        .optional(),
)

export const createCulturaSchema = z.object({
    nome: z.string().min(1, 'Nome não pode ser vazio').max(100, 'Nome deve ter no máximo 100 caracteres'),
    cor: hexColor,
    hectares: hectaresOptional,
})

export const updateCulturaSchema = z.object({
    nome: z.string().min(1, 'Nome não pode ser vazio').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
    cor: hexColor.optional(),
    hectares: hectaresOptional,
})
