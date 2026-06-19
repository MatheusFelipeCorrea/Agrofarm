import { normalizarNomeCultura } from '../../config/culturaNcm.config.js'
import { AppError } from '../errors/AppError.js'

const STATUS_LABELS = {
    SECAGEM: 'Secagem',
    COLHEITA: 'Colheita',
    PLANTIO: 'Plantio',
    ADUBACAO: 'Adubação',
    PULVERIZACAO: 'Pulverização',
}

const STATUS_GERAIS = ['PLANTIO', 'COLHEITA', 'ADUBACAO', 'PULVERIZACAO']

/** Secagem é exclusiva de culturas de café. */
export function isCulturaCafe(nomeCultura) {
    const chave = normalizarNomeCultura(nomeCultura)
    return chave === 'cafe' || chave.includes('cafe')
}

export function statusPermitidosParaCultura(nomeCultura) {
    const valores = isCulturaCafe(nomeCultura) ? ['SECAGEM', ...STATUS_GERAIS] : STATUS_GERAIS
    return valores.map((value) => ({ value, label: STATUS_LABELS[value] ?? value }))
}

export function statusPadraoParaCultura(nomeCultura) {
    return isCulturaCafe(nomeCultura) ? 'SECAGEM' : 'PLANTIO'
}

export function assertStatusValidoParaCultura(nomeCultura, status) {
    const permitidos = statusPermitidosParaCultura(nomeCultura).map((s) => s.value)
    if (!permitidos.includes(status)) {
        const msg = isCulturaCafe(nomeCultura)
            ? 'Status inválido para esta cultura'
            : 'Secagem está disponível apenas para culturas de café'
        throw new AppError(msg, 400)
    }
}
