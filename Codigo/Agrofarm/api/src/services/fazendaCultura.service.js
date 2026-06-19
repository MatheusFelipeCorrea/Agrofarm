import { AppError } from '../shared/errors/AppError.js'

import { assertFazendaOperavelPorId } from '../shared/fazenda/fazendaOperacao.js'

import { assertStatusValidoParaCultura, statusPadraoParaCultura } from '../shared/cultura/culturaStatus.js'

import {

    resolverHectaresParaVinculo,

    sincronizarHectaresVinculo,

    somarHectaresTalhoes,

} from '../shared/cultura/fazendaCulturaHectares.js'

import { fazendaService } from './fazenda.service.js'

import { culturaRepository } from '../repositories/cultura.repository.js'

import { fazendaCulturaRepository } from '../repositories/fazendaCultura.repository.js'



const CAMPOS_GLOBAIS_CULTURA = ['nome', 'cor']



function validarEscopoDeVinculo(dados) {

    const campoGlobal = CAMPOS_GLOBAIS_CULTURA.find((campo) => Object.hasOwn(dados, campo))



    if (campoGlobal) {

        throw new AppError(

            'Este endpoint gerencia apenas o vinculo da cultura com a fazenda. Use /api/culturas para alterar dados globais da cultura.',

            400,

        )

    }

}



async function listarComHectaresSincronizados(fazendaId) {

    const vinculos = await fazendaCulturaRepository.listarPorFazenda(fazendaId)



    await Promise.all(

        vinculos.map(async (v) => {

            const hectares = await somarHectaresTalhoes(fazendaId, v.cultura_id)

            const atual = Number(v.hectares ?? 0)

            if (Math.abs(atual - hectares) > 0.001) {

                await fazendaCulturaRepository.update(v.id, { hectares })

                v.hectares = hectares

            }

        }),

    )



    return vinculos

}



export const fazendaCulturaService = {

    listarPorFazenda: async (fazendaId, usuario) => {

        await fazendaService.buscarPorId(fazendaId, usuario)

        return listarComHectaresSincronizados(fazendaId)

    },



    criar: async (fazendaId, dados, usuario) => {

        validarEscopoDeVinculo(dados)

        await fazendaService.buscarPorId(fazendaId, usuario)

        await assertFazendaOperavelPorId(fazendaId)



        const cultura = await culturaRepository.buscarPorId(dados.culturaId)



        if (!cultura) {

            throw new AppError('Cultura não encontrada', 404)

        }



        const status = dados.status ?? statusPadraoParaCultura(cultura.nome)
        assertStatusValidoParaCultura(cultura.nome, status)



        const existe = await fazendaCulturaRepository.buscarPorChave({

            fazendaId,

            culturaId: dados.culturaId,

        })

        if (existe) {

            throw new AppError('Esta cultura já está vinculada à fazenda', 409)

        }



        const hectares = await resolverHectaresParaVinculo(fazendaId, dados.culturaId)



        try {

            return await fazendaCulturaRepository.create({

                fazendaId,

                culturaId: dados.culturaId,

                hectares,

                status,

            })

        } catch (error) {

            if (error?.code === 'P2002') {

                throw new AppError('Esta cultura já está vinculada à fazenda', 409)

            }

            throw error

        }

    },



    atualizar: async (fazendaId, id, dados, usuario) => {

        validarEscopoDeVinculo(dados)

        await fazendaService.buscarPorId(fazendaId, usuario)

        await assertFazendaOperavelPorId(fazendaId)



        const vinculo = await fazendaCulturaRepository.buscarPorId(id)

        if (!vinculo || vinculo.fazenda_id !== fazendaId) {

            throw new AppError('Vínculo não encontrado', 404)

        }



        if (!dados.status) {

            throw new AppError('Informe o status da cultura', 400)

        }



        assertStatusValidoParaCultura(vinculo.culturas?.nome, dados.status)



        const hectares = await somarHectaresTalhoes(fazendaId, vinculo.cultura_id)



        return fazendaCulturaRepository.update(id, {

            status: dados.status,

            hectares,

        })

    },



    deletar: async (fazendaId, id, usuario) => {

        await fazendaService.buscarPorId(fazendaId, usuario)

        await assertFazendaOperavelPorId(fazendaId)



        const vinculo = await fazendaCulturaRepository.buscarPorId(id)

        if (!vinculo || vinculo.fazenda_id !== fazendaId) {

            throw new AppError('Vínculo não encontrado', 404)

        }



        await fazendaCulturaRepository.delete(id)

    },



    sincronizarHectaresVinculo,

}


