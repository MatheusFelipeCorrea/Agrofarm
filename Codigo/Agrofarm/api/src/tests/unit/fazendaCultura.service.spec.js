import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../services/fazenda.service.js', () => ({

    fazendaService: {

        buscarPorId: vi.fn(),

    },

}))



vi.mock('../../repositories/cultura.repository.js', () => ({

    culturaRepository: {

        buscarPorId: vi.fn(),

    },

}))



vi.mock('../../shared/fazenda/fazendaOperacao.js', () => ({

    assertFazendaOperavelPorId: vi.fn(),

}))



vi.mock('../../repositories/fazendaCultura.repository.js', () => ({

    fazendaCulturaRepository: {

        listarPorFazenda: vi.fn(),

        buscarPorId: vi.fn(),

        buscarPorChave: vi.fn(),

        create: vi.fn(),

        update: vi.fn(),

        delete: vi.fn(),

        sumHectaresTalhoes: vi.fn(),

    },

}))



const { assertFazendaOperavelPorId } = await import('../../shared/fazenda/fazendaOperacao.js')

const { fazendaCulturaService } = await import('../../services/fazendaCultura.service.js')

const { fazendaService } = await import('../../services/fazenda.service.js')

const { culturaRepository } = await import('../../repositories/cultura.repository.js')

const { fazendaCulturaRepository } = await import('../../repositories/fazendaCultura.repository.js')



describe('fazendaCulturaService', () => {

    beforeEach(() => {

        vi.clearAllMocks()

        fazendaService.buscarPorId.mockResolvedValue({ id: 'faz-1' })

        assertFazendaOperavelPorId.mockResolvedValue({ id: 'faz-1', tipo: 'PROPRIA' })

        fazendaCulturaRepository.sumHectaresTalhoes.mockResolvedValue(12.5)

    })



    it('bloqueia criacao duplicada de cultura na mesma fazenda', async () => {

        culturaRepository.buscarPorId.mockResolvedValue({ id: 'cult-1', nome: 'Soja' })

        fazendaCulturaRepository.buscarPorChave.mockResolvedValue({ id: 'vinc-1' })



        await expect(

            fazendaCulturaService.criar(

                'faz-1',

                { culturaId: 'cult-1', status: 'PLANTIO' },

                { id: 'user-1', role: 'ADMIN' },

            ),

        ).rejects.toMatchObject({

            message: 'Esta cultura já está vinculada à fazenda',

            statusCode: 409,

        })



        expect(fazendaCulturaRepository.create).not.toHaveBeenCalled()

    })



    it('bloqueia criacao sem talhao no mapa', async () => {

        culturaRepository.buscarPorId.mockResolvedValue({ id: 'cult-1', nome: 'Soja' })

        fazendaCulturaRepository.buscarPorChave.mockResolvedValue(null)

        fazendaCulturaRepository.sumHectaresTalhoes.mockResolvedValue(0)



        await expect(

            fazendaCulturaService.criar(

                'faz-1',

                { culturaId: 'cult-1', status: 'PLANTIO' },

                { id: 'user-1', role: 'ADMIN' },

            ),

        ).rejects.toMatchObject({

            message: 'Cadastre ao menos um talhão desta cultura no mapa da fazenda antes de vincular.',

            statusCode: 400,

        })

    })



    it('bloqueia secagem para cultura que nao e cafe', async () => {

        culturaRepository.buscarPorId.mockResolvedValue({ id: 'cult-1', nome: 'Soja' })

        fazendaCulturaRepository.buscarPorChave.mockResolvedValue(null)



        await expect(

            fazendaCulturaService.criar(

                'faz-1',

                { culturaId: 'cult-1', status: 'SECAGEM' },

                { id: 'user-1', role: 'ADMIN' },

            ),

        ).rejects.toMatchObject({

            message: 'Secagem está disponível apenas para culturas de café',

            statusCode: 400,

        })

    })



    it('cria o vinculo com hectares dos talhoes', async () => {

        const vinculo = { id: 'vinc-2' }

        culturaRepository.buscarPorId.mockResolvedValue({ id: 'cult-2', nome: 'Café Arábica' })

        fazendaCulturaRepository.buscarPorChave.mockResolvedValue(null)

        fazendaCulturaRepository.create.mockResolvedValue(vinculo)



        const resultado = await fazendaCulturaService.criar(

            'faz-1',

            { culturaId: 'cult-2', status: 'SECAGEM' },

            { id: 'user-1', role: 'ADMIN' },

        )



        expect(resultado).toEqual(vinculo)

        expect(fazendaCulturaRepository.create).toHaveBeenCalledWith({

            fazendaId: 'faz-1',

            culturaId: 'cult-2',

            hectares: 12.5,

            status: 'SECAGEM',

        })

    })



    it('atualiza apenas status e recalcula hectares dos talhoes', async () => {

        fazendaCulturaRepository.buscarPorId.mockResolvedValue({

            id: 'vinc-1',

            fazenda_id: 'faz-1',

            cultura_id: 'cult-2',

            culturas: { nome: 'Café' },

        })

        fazendaCulturaRepository.update.mockResolvedValue({ id: 'vinc-1' })



        await fazendaCulturaService.atualizar(

            'faz-1',

            'vinc-1',

            { status: 'COLHEITA' },

            { id: 'user-1', role: 'ADMIN' },

        )



        expect(fazendaCulturaRepository.update).toHaveBeenCalledWith('vinc-1', {

            status: 'COLHEITA',

            hectares: 12.5,

        })

    })

})


