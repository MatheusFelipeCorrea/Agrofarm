import { AppError } from '../errors/AppError.js'
import { fazendaCulturaRepository } from '../../repositories/fazendaCultura.repository.js'

export async function somarHectaresTalhoes(fazendaId, culturaId) {
    if (!culturaId) return 0
    return fazendaCulturaRepository.sumHectaresTalhoes(fazendaId, culturaId)
}

export async function sincronizarHectaresVinculo(fazendaId, culturaId) {
    if (!fazendaId || !culturaId) return

    const vinculo = await fazendaCulturaRepository.buscarPorChave({ fazendaId, culturaId })
    if (!vinculo) return

    const hectares = await somarHectaresTalhoes(fazendaId, culturaId)
    await fazendaCulturaRepository.update(vinculo.id, { hectares })
}

export async function resolverHectaresParaVinculo(fazendaId, culturaId) {
    const hectares = await somarHectaresTalhoes(fazendaId, culturaId)
    if (hectares <= 0) {
        throw new AppError(
            'Cadastre ao menos um talhão desta cultura no mapa da fazenda antes de vincular.',
            400,
        )
    }
    return hectares
}
