import { z } from 'zod'

export const createLucroSchema = z.object({
    colheitaId: z.string().uuid('colheitaId inválido'),
    quantidadeSacas: z
        .number()
        .finite('Quantidade de sacas inválida')
        .positive('Quantidade de sacas deve ser positiva')
        .max(1_000_000_000, 'Quantidade de sacas excede o limite permitido'),
    valorUnitario: z.number().positive('Valor da saca deve ser positivo'),
    comprador: z.string().min(2, 'Comprador deve ter ao menos 2 caracteres').max(150, 'Comprador muito longo'),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve estar em YYYY-MM-DD'),
})

export const updateLucroSchema = createLucroSchema.partial().refine(
    (body) => Object.keys(body).length > 0,
    'Informe ao menos um campo para atualizar',
)

export const marcarRecebimentoArrendamentoSchema = z.object({
    status: z.enum(['RECEBIDO', 'NAO_RECEBIDO', 'PENDENTE'], {
        errorMap: () => ({
            message: 'status deve ser RECEBIDO, NAO_RECEBIDO ou PENDENTE',
        }),
    }),
})

export const lucroFiltroSchema = z.object({
    fazendaId: z
        .union([z.string().uuid('fazendaId inválido'), z.literal('all')])
        .optional(),
    culturaId: z.string().uuid('culturaId inválido').optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from deve estar em YYYY-MM-DD').optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to deve estar em YYYY-MM-DD').optional(),
    mes: z.coerce.number().int().min(1).max(12).optional(),
    ano: z.coerce.number().int().min(2000).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
}).refine(
    (query) => !(query.from && query.to) || query.from <= query.to,
    {
        message: 'from nao pode ser maior que to',
        path: ['from'],
    },
)
