import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../repositories/poligonoHistorico.repository.js', () => ({
    poligonoHistoricoRepository: {
        arquivar: vi.fn(),
        listarColheitasVencidas: vi.fn(),
        limparDataColheita: vi.fn(),
        buscarUltimaColheita: vi.fn(),
        buscarColheitaPorFazendaCulturaData: vi.fn(),
        criarColheitaDoMapa: vi.fn(),
        atualizarAreaColheita: vi.fn(),
    },
}))

vi.mock('../../services/poligono.service.js', () => ({
    poligonoService: {
        deletar: vi.fn(),
        criar: vi.fn(),
    },
}))

vi.mock('../../services/fazendaCultura.service.js', () => ({
    fazendaCulturaService: {
        sincronizarHectaresVinculo: vi.fn(),
    },
}))

vi.mock('../../repositories/fazenda.repository.js', () => ({
    fazendaRepository: {
        buscarPorId: vi.fn(),
        usuarioTemVinculo: vi.fn(),
    },
}))

const { poligonoHistoricoRepository } = await import('../../repositories/poligonoHistorico.repository.js')
const { poligonoHistoricoService } = await import('../../services/poligonoHistorico.service.js')

describe('poligonoHistoricoService.arquivarPoligonoExcluido', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        poligonoHistoricoRepository.arquivar.mockResolvedValue({ id: 'hist-1' })
    })

    it('cria colheita automaticamente quando talhão tem data de colheita', async () => {
        const poligono = {
            id: 'pol-1',
            fazenda_id: 'faz-1',
            cultura_id: 'cul-1',
            data_colheita: '2025-06-01',
            area_hectares: 12.5,
            nome: 'Soja',
            geometria: { type: 'Polygon', coordinates: [] },
        }

        poligonoHistoricoRepository.buscarColheitaPorFazendaCulturaData.mockResolvedValue(null)
        poligonoHistoricoRepository.criarColheitaDoMapa.mockResolvedValue({
            id: 'col-1',
            data_colheita: new Date('2025-06-01'),
        })

        await poligonoHistoricoService.arquivarPoligonoExcluido(poligono)

        expect(poligonoHistoricoRepository.criarColheitaDoMapa).toHaveBeenCalledWith(
            expect.objectContaining({
                fazenda_id: 'faz-1',
                cultura_id: 'cul-1',
                area: 12.5,
                ano: 2025,
            }),
        )
        expect(poligonoHistoricoRepository.arquivar).toHaveBeenCalledWith(
            poligono,
            expect.objectContaining({
                status: 'COLHIDA',
                colheita_id: 'col-1',
            }),
        )
    })

    it('reutiliza colheita existente na mesma data sem duplicar', async () => {
        const poligono = {
            id: 'pol-2',
            fazenda_id: 'faz-1',
            cultura_id: 'cul-1',
            data_colheita: '2025-06-01',
            area_hectares: 8,
            nome: 'Soja 2',
            geometria: { type: 'Polygon', coordinates: [] },
        }

        poligonoHistoricoRepository.buscarColheitaPorFazendaCulturaData.mockResolvedValue({
            id: 'col-existente',
            sacas_produzidas: 100,
            area: 20,
            data_colheita: new Date('2025-06-01'),
        })

        await poligonoHistoricoService.arquivarPoligonoExcluido(poligono)

        expect(poligonoHistoricoRepository.criarColheitaDoMapa).not.toHaveBeenCalled()
        expect(poligonoHistoricoRepository.atualizarAreaColheita).not.toHaveBeenCalled()
        expect(poligonoHistoricoRepository.arquivar).toHaveBeenCalledWith(
            poligono,
            expect.objectContaining({
                status: 'COLHIDA',
                colheita_id: 'col-existente',
            }),
        )
    })

    it('agrega área quando colheita automática ainda não tem sacas', async () => {
        const poligono = {
            id: 'pol-3',
            fazenda_id: 'faz-1',
            cultura_id: 'cul-1',
            data_colheita: '2025-06-01',
            area_hectares: 5,
            nome: 'Soja 3',
            geometria: { type: 'Polygon', coordinates: [] },
        }

        poligonoHistoricoRepository.buscarColheitaPorFazendaCulturaData.mockResolvedValue({
            id: 'col-auto',
            sacas_produzidas: 0,
            area: 10,
            data_colheita: new Date('2025-06-01'),
        })
        poligonoHistoricoRepository.atualizarAreaColheita.mockResolvedValue({
            id: 'col-auto',
            data_colheita: new Date('2025-06-01'),
        })

        await poligonoHistoricoService.arquivarPoligonoExcluido(poligono)

        expect(poligonoHistoricoRepository.atualizarAreaColheita).toHaveBeenCalledWith('col-auto', 15)
    })

    it('marca ENCERRADA quando não há cultura vinculada', async () => {
        const poligono = {
            id: 'pol-4',
            fazenda_id: 'faz-1',
            cultura_id: null,
            data_colheita: '2025-06-01',
            area_hectares: 5,
            nome: 'Área',
            geometria: { type: 'Polygon', coordinates: [] },
        }

        await poligonoHistoricoService.arquivarPoligonoExcluido(poligono)

        expect(poligonoHistoricoRepository.criarColheitaDoMapa).not.toHaveBeenCalled()
        expect(poligonoHistoricoRepository.arquivar).toHaveBeenCalledWith(
            poligono,
            expect.objectContaining({
                status: 'ARQUIVADA',
                colheita_id: null,
            }),
        )
    })
})
