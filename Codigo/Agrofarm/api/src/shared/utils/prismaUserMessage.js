import { Prisma } from '@prisma/client'

/**
 * Converte erros comuns do Prisma em mensagem segura para o cliente.
 * @param {unknown} err
 * @returns {string | null} null se não for um caso tratado
 */
export function prismaErrorToUserMessage(err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002': {
                const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target
                const hint = target ? ` Campos: ${target}.` : ''
                return `Já existe um registro com esse valor (duplicado).${hint}`
            }
            case 'P2003':
                return 'Não foi possível salvar: referência a outro registro inválida ou inexistente.'
            case 'P2000':
            case 'P2020':
            case 'P2033':
                return 'Um valor informado é maior do que o permitido para o campo (por exemplo, hectares ou outro número). Verifique os limites e tente de novo.'
            case 'P2025':
                return 'Registro não encontrado ou já foi removido.'
            default:
                return null
        }
    }
    if (err instanceof Prisma.PrismaClientValidationError) {
        return 'Dados inválidos para o banco de dados. Verifique tipos e campos obrigatórios.'
    }
    return null
}
