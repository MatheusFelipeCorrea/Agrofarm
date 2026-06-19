import { AppError } from '../errors/AppError.js'

function parseData(valor) {
    if (!valor) return null
    const data = new Date(valor)
    if (Number.isNaN(data.getTime())) return null
    return data
}

/**
 * Valida as datas de plantio e colheita de um talhão.
 *
 * @param {object} params
 * @param {string|Date|null} params.data_plantio
 * @param {string|Date|null} params.data_colheita
 * @param {boolean} [params.obrigatorias=false] Quando true, exige ambas as datas.
 */
export function validarDatasPoligono({ data_plantio, data_colheita, obrigatorias = false } = {}) {
    if (obrigatorias) {
        if (!data_plantio) {
            throw new AppError('A data de plantio é obrigatória', 400)
        }
        if (!data_colheita) {
            throw new AppError('A data de colheita é obrigatória', 400)
        }
    }

    const plantio = parseData(data_plantio)
    const colheita = parseData(data_colheita)

    if (data_plantio && !plantio) {
        throw new AppError('Data de plantio inválida', 400)
    }
    if (data_colheita && !colheita) {
        throw new AppError('Data de colheita inválida', 400)
    }

    if (plantio && colheita && colheita < plantio) {
        throw new AppError('A data de colheita deve ser igual ou posterior à data de plantio', 400)
    }
}
