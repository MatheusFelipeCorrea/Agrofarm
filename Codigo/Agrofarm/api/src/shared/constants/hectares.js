/**
 * Limite alinhado ao tipo @db.Decimal(10, 2) no PostgreSQL (Prisma):
 * 10 dígitos no total, 2 após a vírgula → máximo 99.999.999,99.
 */
export const HECTARES_MAX = 99_999_999.99

export const HECTARES_MAX_MESSAGE =
    'Hectares não pode ser maior que 99.999.999,99.'
