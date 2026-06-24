import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../repositories/dashboard.repository.js', () => ({
	dashboardRepository: {
		listarFazendasVisiveis: vi.fn(),
		producaoPorCultura: vi.fn(),
		estoquePorCultura: vi.fn(),
		estoquePorFazenda: vi.fn(),
		financeiroPorFazenda: vi.fn(),
		buscarMaiorGasto: vi.fn(),
		extratoRecente: vi.fn(),
		totalLucros: vi.fn(),
		totalGastos: vi.fn(),
	},
}))

vi.mock('../../services/cotacao.service.js', () => ({
	cotacaoService: {
		buscarDolar: vi.fn(),
		buscarPainelMercado: vi.fn(),
	},
}))

vi.mock('../../database/client.js', () => ({
	prisma: {
		fazendas: { findMany: vi.fn() },
		colheitas: {
			groupBy: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
		},
		culturas: { findMany: vi.fn() },
		lucros: { findMany: vi.fn() },
		gastos: { findMany: vi.fn() },
		lembretes: { findMany: vi.fn() },
		insumos_atividades: { findMany: vi.fn() },
	},
}))

const { montarContextoCompleto } = await import('../../services/chatbot.context.js')
const { dashboardRepository } = await import('../../repositories/dashboard.repository.js')
const { cotacaoService } = await import('../../services/cotacao.service.js')
const { prisma } = await import('../../database/client.js')

const usuario = {
	id: 'user-1',
	nome: 'Maria Silva',
	email: 'maria@test.com',
	role: 'ADMIN',
}

function setupMocksComFazenda() {
	dashboardRepository.listarFazendasVisiveis.mockResolvedValue([
		{ id: 'faz-1', nome: 'Fazenda Norte' },
	])
	prisma.fazendas.findMany.mockResolvedValue([
		{
			id: 'faz-1',
			nome: 'Fazenda Norte',
			tipo: 'PROPRIA',
			localizacao: 'MG',
			fazenda_culturas: [
				{ hectares: 100, status: 'ATIVO', culturas: { nome: 'Soja' } },
			],
			_count: { colheitas: 2, poligonos: 3, lembretes: 1 },
		},
	])
	dashboardRepository.producaoPorCultura.mockResolvedValue([
		{ nome: 'Soja', sacas: 500, area: 100, produtividade: 5 },
	])
	dashboardRepository.estoquePorCultura.mockResolvedValue([
		{ nome: 'Soja', peso: 300, dataColheita: new Date('2026-05-01') },
	])
	dashboardRepository.estoquePorFazenda.mockResolvedValue([
		{ fazendaId: 'faz-1', itens: [{ cultura: 'Soja', sacas: 300 }] },
	])
	prisma.colheitas.groupBy.mockResolvedValue([
		{
			fazenda_id: 'faz-1',
			cultura_id: 'cul-1',
			_sum: { sacas_produzidas: 500, area: 100 },
			_max: { data_colheita: new Date('2026-05-01') },
		},
	])
	prisma.culturas.findMany.mockResolvedValue([{ id: 'cul-1', nome: 'Soja' }])
	dashboardRepository.financeiroPorFazenda.mockResolvedValue([
		{
			fazendaId: 'faz-1',
			fazendaNome: 'Fazenda Norte',
			totalLucros: 50000,
			totalGastos: 20000,
			saldo: 30000,
			totalPago: 15000,
			totalPendente: 5000,
		},
	])
	dashboardRepository.buscarMaiorGasto.mockResolvedValue({
		valor: 5000,
		descricao: 'Defensivo',
	})
	dashboardRepository.extratoRecente.mockResolvedValue([
		{ tipo: 'LUCRO', valor: 10000, data: new Date('2026-05-01'), descricao: 'Venda soja' },
	])
	cotacaoService.buscarDolar.mockResolvedValue({ valor: 5.5, fonte: 'seed' })
	cotacaoService.buscarPainelMercado.mockResolvedValue({
		dolar: { valor: 5.5 },
		commodities: [{ id: 'soja', nome: 'Soja', valor: 12.5, variacao: 1.2 }],
	})
	dashboardRepository.totalLucros.mockResolvedValue(50000)
	dashboardRepository.totalGastos.mockResolvedValue(20000)
	prisma.colheitas.count.mockResolvedValue(2)
	prisma.lembretes.findMany.mockResolvedValue([
		{
			titulo: 'Pulverizar',
			descricao: null,
			data_lembrete: new Date('2026-06-10'),
			status: 'PENDENTE',
			fazendas: { nome: 'Fazenda Norte' },
		},
	])
	prisma.insumos_atividades.findMany.mockResolvedValue([
		{
			item: 'Glifosato',
			quantidade: 10,
			unidade: 'L',
			valor_unitario: 50,
			data: new Date('2026-05-15'),
			categoria: 'DEFENSIVO',
			fornecedor: 'Agro X',
			fazendas: { nome: 'Fazenda Norte' },
		},
	])
	prisma.colheitas.findMany.mockResolvedValue([])
	prisma.lucros.findMany.mockResolvedValue([])
	prisma.gastos.findMany.mockResolvedValue([])
}

describe('montarContextoCompleto', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('monta contexto rico com fazendas e resumo financeiro', async () => {
		setupMocksComFazenda()

		const ctx = await montarContextoCompleto(usuario)

		expect(ctx.usuario.nome).toBe('Maria Silva')
		expect(ctx.fazendas).toHaveLength(1)
		expect(ctx.fazendas[0].nome).toBe('Fazenda Norte')
		expect(ctx.resumoGeral.totalLucros).toBe(50000)
		expect(ctx.resumoGeral.saldoAproximado).toBe(30000)
		expect(ctx.modulosAgroFarm.length).toBeGreaterThan(5)
	})

	it('inclui sinais por fazenda e cultura vs mercado', async () => {
		setupMocksComFazenda()

		const ctx = await montarContextoCompleto(usuario)

		expect(ctx.sinaisPorFazenda).toHaveLength(1)
		expect(ctx.sinaisPorFazenda[0].fazendaNome).toBe('Fazenda Norte')
		expect(ctx.culturaVsMercado.some((c) => c.cultura === 'Soja')).toBe(true)
		expect(ctx.comparativoFazendas[0].fazendaId).toBe('faz-1')
	})

	it('retorna contexto mínimo quando usuário não tem fazendas', async () => {
		dashboardRepository.listarFazendasVisiveis.mockResolvedValue([])
		prisma.fazendas.findMany.mockResolvedValue([])
		cotacaoService.buscarDolar.mockResolvedValue(null)
		cotacaoService.buscarPainelMercado.mockResolvedValue(null)
		prisma.lembretes.findMany.mockResolvedValue([])

		const ctx = await montarContextoCompleto(usuario)

		expect(ctx.fazendas).toEqual([])
		expect(ctx.resumoGeral.totalFazendas).toBe(0)
		expect(ctx.resumoGeral.colheitasTotal).toBe(0)
		expect(ctx.lembretesRecentes).toEqual([])
	})

	it('mapeia lembretes e insumos recentes', async () => {
		setupMocksComFazenda()

		const ctx = await montarContextoCompleto(usuario)

		expect(ctx.lembretesRecentes[0].titulo).toBe('Pulverizar')
		expect(ctx.insumosRecentes[0].item).toBe('Glifosato')
		expect(ctx.insumosRecentes[0].valorTotal).toBe(500)
	})
})
