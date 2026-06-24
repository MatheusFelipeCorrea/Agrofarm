import { z } from 'zod'

const optionalUuidQuery = (field) =>
    z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return undefined
            return val
        },
        z.string().uuid(`${field} inválido`).optional(),
    )

export const listarEstoqueQuerySchema = z.object({
    fazendaId: z
        .preprocess(
            (val) => {
                if (val === '' || val === null || val === undefined) return undefined
                return val
            },
            z.union([z.literal('all'), z.string().uuid('fazendaId inválido')]).optional(),
        ),
    culturaId: optionalUuidQuery('culturaId'),
    colheitaId: optionalUuidQuery('colheitaId'),
    busca: z.preprocess(
        (val) => {
            if (val === '' || val === null || val === undefined) return undefined
            return val
        },
        z.string().max(120).optional(),
    ),
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(5),
})

export const estoqueColheitaParamsSchema = z.object({
    colheitaId: z.string().uuid('colheitaId inválido'),
})

export const confirmarArrendamentoSchema = z.object({
    colheitaId: z.string().uuid('colheitaId inválido'),
})

export const marcarEntregaArrendamentoSchema = z.object({
    status: z.enum(['NAO_ENTREGUE', 'PENDENTE'], {
        errorMap: () => ({ message: 'Status deve ser NAO_ENTREGUE ou PENDENTE' }),
    }),
})

export const entregaArrendamentoParamsSchema = z.object({
    entregaId: z.string().uuid('entregaId inválido'),
})
