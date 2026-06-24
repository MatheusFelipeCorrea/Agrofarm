import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../shared/gemini/geminiClient.js', () => ({
	geminiInsightsDisponivel: vi.fn(),
	invocarGeminiTexto: vi.fn(),
}))

vi.mock('../../repositories/dashboard.repository.js', () => ({
	dashboardRepository: {
		listarFazendasVisiveis: vi.fn(),
		estoquePorFazenda: vi.fn(),
	},
}))

vi.mock('../../repositories/insights.repository.js', () => ({
	insightsRepository: {
		estoquePorCultura: vi.fn(),
		somarLucrosNoPeriodo: vi.fn(),
		gastosResumoPorFazenda: vi.fn(),
		buscarUltimosPorEscopo: vi.fn(),
		salvarSnapshot: vi.fn(),
	},
}))

vi.mock('../../services/cotacao.service.js', () => ({
	cotacaoService: {
		buscarDolar: vi.fn(),
	},
}))

const { insightsService, insightEstaDesatualizado } = await import('../../services/insights.service.js')
const { dashboardRepository } = await import('../../repositories/dashboard.repository.js')
const { insightsRepository } = await import('../../repositories/insights.repository.js')
const { cotacaoService } = await import('../../services/cotacao.service.js')
const { geminiInsightsDisponivel, invocarGeminiTexto } = await import('../../shared/gemini/geminiClient.js')

const usuarioAdmin = { id: 'admin-1', role: 'ADMIN', nome: 'Admin Teste' }

function mockDadosBase() {
	dashboardRepository.listarFazendasVisiveis.mockResolvedValue([
		{ id: 'faz-1', nome: 'Fazenda Norte' },
		{ id: 'faz-2', nome: 'Fazenda Sul' },
	])
	insightsRepository.estoquePorCultura.mockResolvedValue([
		{ nome: 'Soja', emEstoque: 500, cor: '#1f8f2f' },
		{ nome: 'Milho', emEstoque: 200, cor: '#eab308' },
	])
	insightsRepository.somarLucrosNoPeriodo
		.mockResolvedValueOnce(10000)
		.mockResolvedValueOnce(8000)
	insightsRepository.gastosResumoPorFazenda.mockResolvedValue([
		{
			fazendaId: 'faz-1',
			fazendaNome: 'Fazenda Norte',
			totalPago: 3000,
			totalPendente: 5000,
			totalGasto: 8000,
			totalLucros: 12000,
			saldo: 4000,
		},
		{
			fazendaId: 'faz-2',
			fazendaNome: 'Fazenda Sul',
			totalPago: 2000,
			totalPendente: 1000,
			totalGasto: 3000,
			totalLucros: 5000,
			saldo: 2000,
		},
	])
	dashboardRepository.estoquePorFazenda.mockResolvedValue([
		{ fazendaId: 'faz-1', itens: [{ cultura: 'Soja', sacas: 500 }] },
	])
	cotacaoService.buscarDolar.mockResolvedValue({ valor: 5.5, fonte: 'seed' })
	geminiInsightsDisponivel.mockReturnValue(false)
}

describe('insightsService', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockDadosBase()
	})

	describe('insightEstaDesatualizado', () => {
		it('considera desatualizado após intervalo', () => {
			const antigo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
			expect(insightEstaDesatualizado(antigo)).toBe(true)
			expect(insightEstaDesatualizado(new Date().toISOString())).toBe(false)
		})
	})

	describe('buscarInsights', () => {
		it('nega acesso para não-ADMIN', async () => {
			await expect(
				insightsService.buscarInsights({
					usuario: { id: 'u1', role: 'FUNCIONARIO' },
					fazendaId: 'todas',
				}),
			).rejects.toMatchObject({ statusCode: 403 })
		})

		it('gera cards com fallback de dados quando não há snapshot', async () => {
			insightsRepository.buscarUltimosPorEscopo.mockResolvedValue([])
			insightsRepository.salvarSnapshot.mockImplementation(({ tipo, conteudo }) => ({
				tipo,
				conteudo,
				gerado_em: new Date().toISOString(),
			}))

			const resultado = await insightsService.buscarInsights({
				usuario: usuarioAdmin,
				fazendaId: 'todas',
			})

			expect(resultado.escopo).toBe('TODAS')
			expect(resultado.saudacao?.texto).toContain('Admin')
			expect(resultado.estoque?.origem).toBe('dados')
			expect(resultado.fazendasCarousel.length).toBe(2)
			expect(insightsRepository.salvarSnapshot).toHaveBeenCalled()
		})

		it('reutiliza snapshots existentes', async () => {
			insightsRepository.buscarUltimosPorEscopo.mockResolvedValue([
				{
					tipo: 'SAUDACAO',
					conteudo: {
						titulo: 'Boas-vindas',
						texto: 'Snapshot salvo',
						origem: 'cache',
						escopo: 'TODAS',
						escopoLabel: 'Todas as fazendas',
					},
					gerado_em: new Date().toISOString(),
				},
			])

			const resultado = await insightsService.buscarInsights({
				usuario: usuarioAdmin,
				fazendaId: 'todas',
			})

			expect(resultado.saudacao?.texto).toBe('Snapshot salvo')
			expect(resultado.saudacao?.origem).toBe('cache')
		})
	})

	describe('refreshInsight', () => {
		it('força geração e persiste insight refreshável', async () => {
			insightsRepository.salvarSnapshot.mockResolvedValue({
				tipo: 'ESTOQUE',
				conteudo: {
					titulo: 'Situação do Estoque',
					texto: 'Texto IA',
					origem: 'dados',
					escopo: 'TODAS',
					escopoLabel: 'Todas as fazendas',
				},
				gerado_em: new Date().toISOString(),
			})
			invocarGeminiTexto.mockResolvedValue({ ok: true, texto: 'Insight Gemini' })
			geminiInsightsDisponivel.mockReturnValue(true)

			const resultado = await insightsService.refreshInsight({
				usuario: usuarioAdmin,
				tipo: 'ESTOQUE',
				fazendaId: 'todas',
			})

			expect(resultado.atualizados[0].tipo).toBe('ESTOQUE')
			expect(insightsRepository.salvarSnapshot).toHaveBeenCalled()
		})
	})

	describe('obterRecomendacaoDashboard', () => {
		it('retorna recomendação comparativa para escopo TODAS', async () => {
			insightsRepository.buscarUltimosPorEscopo.mockResolvedValue([])

			const resultado = await insightsService.obterRecomendacaoDashboard({
				usuario: usuarioAdmin,
				fazendaId: 'todas',
			})

			expect(resultado.texto).toBeTruthy()
			expect(resultado.escopoLabel).toBe('Todas as fazendas')
		})

		it('retorna recomendação para fazenda única', async () => {
			insightsRepository.buscarUltimosPorEscopo.mockResolvedValue([])

			const resultado = await insightsService.obterRecomendacaoDashboard({
				usuario: usuarioAdmin,
				fazendaId: 'faz-1',
			})

			expect(resultado.texto).toBeTruthy()
			expect(resultado.escopoLabel).toBe('Fazenda Norte')
		})
	})
})
