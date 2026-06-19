import { z } from 'zod'

const uuid = z.string().uuid('Id inválido')

const statusEnum = z.enum(['SECAGEM', 'COLHEITA', 'PLANTIO', 'ADUBACAO', 'PULVERIZACAO'], {
    errorMap: () => ({ message: 'Status inválido' }),
})

export const createFazendaCulturaSchema = z.object({
    culturaId: uuid,
    status: statusEnum.optional(),
})

export const updateFazendaCulturaSchema = z.object({
    status: statusEnum,
})
