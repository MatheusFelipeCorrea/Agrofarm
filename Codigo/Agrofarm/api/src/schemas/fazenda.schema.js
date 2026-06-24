import { z } from 'zod'

const tipoFazendaSchema = z.enum(['PROPRIA', 'ARRENDADA_DE_TERCEIROS', 'ARRENDADA_PARA_TERCEIROS'], {
    errorMap: () => ({
        message: 'Tipo deve ser PROPRIA, ARRENDADA_DE_TERCEIROS ou ARRENDADA_PARA_TERCEIROS',
    }),
})

const periodicidadeArrendamentoSchema = z.enum(['MENSAL', 'SEMESTRAL', 'ANUAL'], {
    errorMap: () => ({
        message: 'Periodicidade deve ser MENSAL, SEMESTRAL ou ANUAL',
    }),
})

const camposArrendamentoSchema = {
    arrendamentoCulturaId: z.string().uuid('Cultura do arrendamento inválida').optional(),
    arrendamentoQuantidadeSacas: z
        .number()
        .positive('Quantidade de sacas deve ser positiva')
        .optional(),
    arrendamentoPeriodicidade: periodicidadeArrendamentoSchema.optional(),
    arrendamentoDataInicio: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar em YYYY-MM-DD')
        .optional(),
}

function validarArrendamentoPorTipo(data, ctx) {
    const isArrendadaParaTerceiros = data.tipo === 'ARRENDADA_PARA_TERCEIROS'
    const temAlgumCampo =
        data.arrendamentoCulturaId !== undefined ||
        data.arrendamentoQuantidadeSacas !== undefined ||
        data.arrendamentoPeriodicidade !== undefined ||
        data.arrendamentoDataInicio !== undefined

    if (isArrendadaParaTerceiros) {
        if (!data.arrendamentoCulturaId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Informe a cultura recebida no arrendamento',
                path: ['arrendamentoCulturaId'],
            })
        }
        if (data.arrendamentoQuantidadeSacas === undefined || data.arrendamentoQuantidadeSacas <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Informe a quantidade de sacas recebidas por período',
                path: ['arrendamentoQuantidadeSacas'],
            })
        }
        if (!data.arrendamentoPeriodicidade) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Informe a periodicidade do recebimento (mensal, semestral ou anual)',
                path: ['arrendamentoPeriodicidade'],
            })
        }
        if (!data.arrendamentoDataInicio) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Informe a data do primeiro recebimento',
                path: ['arrendamentoDataInicio'],
            })
        }
        return
    }

    if (temAlgumCampo) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Campos de arrendamento só se aplicam a fazendas arrendadas para terceiros',
            path: ['arrendamentoCulturaId'],
        })
    }
}

const latitudeSchema = z.number().min(-90).max(90).nullable().optional()
const longitudeSchema = z.number().min(-180).max(180).nullable().optional()

const BRASIL_LAT_MIN = -34
const BRASIL_LAT_MAX = 6
const BRASIL_LNG_MIN = -74
const BRASIL_LNG_MAX = -34

function validarCoordenadasBrasil(data, ctx) {
    if (data.latitude != null && (data.latitude < BRASIL_LAT_MIN || data.latitude > BRASIL_LAT_MAX)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Latitude fora do território brasileiro',
            path: ['latitude'],
        })
    }
    if (data.longitude != null && (data.longitude < BRASIL_LNG_MIN || data.longitude > BRASIL_LNG_MAX)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Longitude fora do território brasileiro',
            path: ['longitude'],
        })
    }
}

export const createFazendaSchema = z
    .object({
        nome: z.string().min(1, 'Nome não pode ser vazio').max(150, 'Nome deve ter no máximo 150 caracteres'),
        tipo: tipoFazendaSchema,
        localizacao: z.string().max(255, 'Localização deve ter no máximo 255 caracteres').optional(),
        latitude: latitudeSchema,
        longitude: longitudeSchema,
        ativa: z.boolean().optional(),
        ...camposArrendamentoSchema,
    })
    .superRefine(validarArrendamentoPorTipo)
    .superRefine(validarCoordenadasBrasil)

export const updateFazendaSchema = z
    .object({
        nome: z.string().min(1, 'Nome não pode ser vazio').max(150, 'Nome deve ter no máximo 150 caracteres').optional(),
        tipo: tipoFazendaSchema.optional(),
        localizacao: z.string().max(255, 'Localização deve ter no máximo 255 caracteres').optional(),
        latitude: latitudeSchema,
        longitude: longitudeSchema,
        ativa: z.boolean().optional(),
        ...camposArrendamentoSchema,
    })
    .refine((body) => Object.keys(body).length > 0, 'Informe ao menos um campo para atualizar')
    .superRefine((data, ctx) => {
        if (data.tipo !== undefined) {
            validarArrendamentoPorTipo(data, ctx)
        } else if (
            data.arrendamentoCulturaId !== undefined ||
            data.arrendamentoQuantidadeSacas !== undefined ||
            data.arrendamentoPeriodicidade !== undefined ||
            data.arrendamentoDataInicio !== undefined
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Envie o tipo ARRENDADA_PARA_TERCEIROS junto com os dados de arrendamento',
                path: ['tipo'],
            })
        }
    })
    .superRefine(validarCoordenadasBrasil)
