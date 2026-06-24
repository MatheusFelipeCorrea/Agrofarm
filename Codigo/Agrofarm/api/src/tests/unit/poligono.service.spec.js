import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../database/client.js', () => ({
	prisma: {
		$queryRaw: vi.fn(),
		$queryRawUnsafe: vi.fn(),
		$executeRaw: vi.fn(),
	},
}))

vi.mock('../../services/geometry.service.js', () => ({
	geometryService: {
		validarGeometria: vi.fn(),
		calcularAreaHectares: vi.fn(),
	},
}))

vi.mock('../../shared/poligono/poligonoNome.js', () => ({
	resolverNomeTalhao: vi.fn(),
}))

const { poligonoService } = await import('../../services/poligono.service.js')
const { prisma } = await import('../../database/client.js')
const { geometryService } = await import('../../services/geometry.service.js')
const { resolverNomeTalhao } = await import('../../shared/poligono/poligonoNome.js')

const poligonoMock = {
	id: 'pol-1',
	fazenda_id: 'faz-1',
	cultura_id: 'cul-1',
	nome: 'Talhão Soja',
	area_hectares: 12.5,
	geometria: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
	cultura_nome: 'Soja',
	cultura_cor: '#1f8f2f',
	data_plantio: null,
	data_colheita: null,
	criado_em: new Date('2026-01-01'),
	atualizado_em: new Date('2026-01-01'),
}

describe('poligonoService', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('busca polígonos por fazenda', async () => {
		prisma.$queryRaw.mockResolvedValue([poligonoMock])

		const resultado = await poligonoService.buscarPorFazenda('faz-1')

		expect(resultado).toEqual([poligonoMock])
		expect(prisma.$queryRaw).toHaveBeenCalled()
	})

	it('verifica sobreposição e retorna talhão conflitante', async () => {
		prisma.$queryRawUnsafe.mockResolvedValue([{ id: 'pol-2', nome: 'Talhão B' }])

		const sobreposto = await poligonoService.verificarSobreposicao({
			fazenda_id: 'faz-1',
			geojson: poligonoMock.geometria,
		})

		expect(sobreposto).toEqual({ id: 'pol-2', nome: 'Talhão B' })
	})

	it('cria polígono com nome resolvido', async () => {
		resolverNomeTalhao.mockResolvedValue('Soja Norte')
		prisma.$queryRaw.mockResolvedValue([{ ...poligonoMock, nome: 'Soja Norte' }])

		const criado = await poligonoService.criar({
			fazenda_id: 'faz-1',
			nome: null,
			geojson: poligonoMock.geometria,
			area_hectares: 12.5,
			cultura_id: 'cul-1',
		})

		expect(criado.nome).toBe('Soja Norte')
		expect(resolverNomeTalhao).toHaveBeenCalled()
	})

	it('falha ao criar sem nome nem cultura', async () => {
		resolverNomeTalhao.mockResolvedValue(null)

		await expect(
			poligonoService.criar({
				fazenda_id: 'faz-1',
				geojson: poligonoMock.geometria,
				area_hectares: 5,
			}),
		).rejects.toMatchObject({ statusCode: 400 })
	})

	it('exporta GeoJSON FeatureCollection', async () => {
		prisma.$queryRaw.mockResolvedValue([poligonoMock])

		const geojson = await poligonoService.exportarGeoJSON('faz-1')

		expect(geojson.type).toBe('FeatureCollection')
		expect(geojson.features[0].properties.nome).toBe('Talhão Soja')
		expect(geojson.features[0].geometry.type).toBe('Polygon')
	})

	it('importa features válidas e ignora inválidas', async () => {
		const feature = {
			type: 'Feature',
			geometry: poligonoMock.geometria,
			properties: { nome: 'Importado' },
		}

		geometryService.validarGeometria.mockResolvedValue({ valido: true })
		geometryService.calcularAreaHectares.mockReturnValue(10)
		resolverNomeTalhao.mockResolvedValue('Importado')
		prisma.$queryRawUnsafe.mockResolvedValue([])
		prisma.$queryRaw.mockResolvedValue([{ ...poligonoMock, nome: 'Importado' }])

		const criados = await poligonoService.importarGeoJSON('faz-1', {
			type: 'FeatureCollection',
			features: [feature, { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] } }],
		}, 'user-1')

		expect(criados).toHaveLength(1)
		expect(geometryService.validarGeometria).toHaveBeenCalledTimes(1)
	})

	it('deleta polígono por id', async () => {
		prisma.$executeRaw.mockResolvedValue(1)

		await poligonoService.deletar('pol-1')

		expect(prisma.$executeRaw).toHaveBeenCalled()
	})
})
