import { culturaRepository } from '../repositories/cultura.repository.js'
import { AppError } from '../shared/errors/AppError.js'

export const culturaService = {
    listarTodas: async () => {
        return culturaRepository.buscarTodos()
    },

    criar: async (dados) => {
        const nomeNormalizado = dados.nome.trim()

        const existe = await culturaRepository.buscarPorNome(nomeNormalizado)
        if (existe) {
            throw new AppError('Já existe uma cultura com esse nome', 409)
        }

        const data = {
            nome: nomeNormalizado,
            cor: dados.cor,
        }
        if (dados.hectares !== undefined && dados.hectares !== null) {
            const h = Number(dados.hectares)
            if (Number.isFinite(h) && h >= 0) {
                data.hectares = h
            }
        }

        return culturaRepository.create(data)
    },

    atualizar: async (id, dados) => {
        const cultura = await culturaRepository.buscarPorId(id)
        if (!cultura) {
            throw new AppError('Cultura não encontrada', 404)
        }

        if (dados.nome && dados.nome.trim() !== cultura.nome) {
            const existe = await culturaRepository.buscarPorNome(dados.nome.trim())
            if (existe) {
                throw new AppError('Já existe uma cultura com esse nome', 409)
            }
        }

        const payload = {
            ...(dados.nome ? { nome: dados.nome.trim() } : {}),
            ...(dados.cor ? { cor: dados.cor } : {}),
        }
        if (dados.hectares !== undefined && dados.hectares !== null) {
            const h = Number(dados.hectares)
            if (Number.isFinite(h) && h >= 0) {
                payload.hectares = h
            }
        }

        if (Object.keys(payload).length === 0) {
            throw new AppError('Informe ao menos um campo para atualizar', 400)
        }

        return culturaRepository.update(id, payload)
    },

    deletar: async (id) => {
        const cultura = await culturaRepository.buscarPorId(id)
        if (!cultura) {
            throw new AppError('Cultura não encontrada', 404)
        }

        const vinculos = await culturaRepository.contarVinculos(id)
        if (vinculos.fazendaCulturas > 0) {
            throw new AppError('Não é possível excluir: cultura está vinculada a fazendas', 400)
        }
        if (vinculos.colheitas > 0) {
            throw new AppError('Não é possível excluir: cultura possui colheitas registradas', 400)
        }

        await culturaRepository.delete(id)
    },
}
