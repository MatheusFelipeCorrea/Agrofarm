import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../repositories/estoque.repository.js', () => ({
	estoqueRepository: {
		buscarColheitasComLucros: vi.fn(),
		buscarColheitaPorId: vi.fn(),
		buscarEntregasPendentes: vi.fn(),
		buscarEntregaPorId: vi.fn(),
		atualizarEntrega: vi.fn(),
	},
}))

vi.mock('../../repositories/usuario.repository.js', () => ({
	usuarioRepository: {
		buscarIdsFazendasVinculadas: vi.fn(),
	},
}))

vi.mock('../../shared/fazenda/arrendamentoEntrega.js', () => ({
	sincronizarEntregasArrendamentoAutomaticos: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../shared/estoque/saldoSacas.js', () => ({
	calcularSaldoColheita: vi.fn(),
	assertVendaSacasPermitida: vi.fn(),
}))

vi.mock('../../services/notificacao.service.js', () => ({
	notificacaoService: {
		sincronizarNotificacoesArrendamento: vi.fn().mockResolvedValue(undefined),
		resolverNotificacaoArrendamento: vi.fn().mockResolvedValue(undefined),
	},
}))

vi.mock('../../database/client.js', () => ({
	prisma: {
		colheitas: {
			findUnique: vi.fn(),
		},
	},
}))

const { estoqueService } = await import('../../services/estoque.service.js')
const { estoqueRepository } = await import('../../repositories/estoque.repository.js')
const { usuarioRepository } = await import('../../repositories/usuario.repository.js')
const { calcularSaldoColheita } = await import('../../shared/estoque/saldoSacas.js')
const { prisma } = await import('../../database/client.js')

const colheitaBase = {
	id: 'col-1',
	ano: 2025,
	fazenda_id: 'faz-1',
	cultura_id: 'cul-soja',
	sacas_produzidas: 1000,
	data_colheita: new Date('2025-06-01'),
	criado_em: new Date('2025-06-01T10:00:00Z'),
	fazendas: { id: 'faz-1', nome: 'Fazenda Norte', localizacao: 'MG' },
	culturas: { id: 'cul-soja', nome: 'Soja', cor: '#1f8f2f' },
	lucros: [
		{
			id: 'luc-1',
			quantidade_sacas: 200,
			comprador: 'Cooperativa',
			data: new Date('2025-07-01'),
			criado_em: new Date('2025-07-01T12:00:00Z'),
		},
	],
	entregas_arrendamento: [],
}

describe('estoqueService', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('listar', () => {
		it('retorna lotes paginados com resumo para ADMIN', async () => {
			estoqueRepository.buscarColheitasComLucros.mockResolvedValue([colheitaBase])
			estoqueRepository.buscarEntregasPendentes.mockResolvedValue({
				items: [{ id: 'ent-1' }],
				meta: { totalItems: 1 },
			})

			const resultado = await estoqueService.listar({
				usuarioId: 'admin-1',
				role: 'ADMIN',
				query: { page: 1, pageSize: 5 },
			})

			expect(resultado.items).toHaveLength(1)
			expect(resultado.items[0].produzidas).toBe(1000)
			expect(resultado.items[0].vendidas).toBe(200)
			expect(resultado.items[0].emEstoque).toBe(800)
			expect(resultado.resumo.totalEmEstoque).toBe(800)
			expect(resultado.arrendamentosPendentes).toEqual([{ id: 'ent-1' }])
			expect(estoqueRepository.buscarEntregasPendentes).toHaveBeenCalled()
		})

		it('filtra por busca e restringe fazendas do FUNCIONARIO', async () => {
			usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(['faz-1'])
			estoqueRepository.buscarColheitasComLucros.mockResolvedValue([
				colheitaBase,
				{
					...colheitaBase,
					id: 'col-2',
					fazendas: { id: 'faz-2', nome: 'Fazenda Sul', localizacao: 'GO' },
					culturas: { id: 'cul-milho', nome: 'Milho', cor: '#eab308' },
				},
			])

			const resultado = await estoqueService.listar({
				usuarioId: 'func-1',
				role: 'FUNCIONARIO',
				query: { busca: 'soja', page: 1, pageSize: 10 },
			})

			expect(resultado.items).toHaveLength(1)
			expect(resultado.items[0].cultura.nome).toBe('Soja')
			expect(estoqueRepository.buscarEntregasPendentes).not.toHaveBeenCalled()
		})

		it('rejeita filtro all para FUNCIONARIO', async () => {
			await expect(
				estoqueService.listar({
					usuarioId: 'func-1',
					role: 'FUNCIONARIO',
					query: { fazendaId: 'all' },
				}),
			).rejects.toMatchObject({ statusCode: 400 })
		})
	})

	describe('buscarDetalhe', () => {
		it('retorna detalhe do lote para ADMIN', async () => {
			estoqueRepository.buscarColheitaPorId.mockResolvedValue(colheitaBase)
			estoqueRepository.buscarColheitasComLucros.mockResolvedValue([colheitaBase])

			const detalhe = await estoqueService.buscarDetalhe({
				usuarioId: 'admin-1',
				role: 'ADMIN',
				colheitaId: 'col-1',
			})

			expect(detalhe.colheitaId).toBe('col-1')
			expect(detalhe.movimentacoes.length).toBeGreaterThan(0)
			expect(detalhe.movimentacoes[0].tipo).toBe('VENDA')
		})

		it('bloqueia FUNCIONARIO sem acesso à fazenda da colheita', async () => {
			usuarioRepository.buscarIdsFazendasVinculadas.mockResolvedValue(['faz-outra'])
			estoqueRepository.buscarColheitaPorId.mockResolvedValue(colheitaBase)

			await expect(
				estoqueService.buscarDetalhe({
					usuarioId: 'func-1',
					role: 'FUNCIONARIO',
					colheitaId: 'col-1',
				}),
			).rejects.toMatchObject({ statusCode: 403 })
		})
	})

	describe('listarArrendamentosPendentes', () => {
		it('nega acesso para não-ADMIN', async () => {
			await expect(
				estoqueService.listarArrendamentosPendentes({ role: 'FUNCIONARIO', query: {} }),
			).rejects.toMatchObject({ statusCode: 403 })
		})
	})

	describe('confirmarEntregaArrendamento', () => {
		it('confirma entrega quando saldo permite', async () => {
			const entrega = {
				id: 'ent-1',
				status: 'PENDENTE',
				cultura_id: 'cul-soja',
				quantidade_sacas: 50,
			}
			estoqueRepository.buscarEntregaPorId.mockResolvedValue(entrega)
			prisma.colheitas.findUnique.mockResolvedValue({
				id: 'col-1',
				cultura_id: 'cul-soja',
				fazenda_id: 'faz-1',
				culturas: { nome: 'Soja' },
				fazendas: { tipo: 'PROPRIA' },
			})
			calcularSaldoColheita.mockResolvedValue({
				totalProduzido: 1000,
				saldoDisponivel: 800,
			})
			estoqueRepository.atualizarEntrega.mockResolvedValue({ ...entrega, status: 'ENTREGUE' })

			const resultado = await estoqueService.confirmarEntregaArrendamento({
				role: 'ADMIN',
				entregaId: 'ent-1',
				colheitaId: 'col-1',
			})

			expect(resultado.status).toBe('ENTREGUE')
			expect(estoqueRepository.atualizarEntrega).toHaveBeenCalledWith('ent-1', {
				status: 'ENTREGUE',
				colheita_id: 'col-1',
			})
		})

		it('rejeita cultura incompatível', async () => {
			estoqueRepository.buscarEntregaPorId.mockResolvedValue({
				id: 'ent-1',
				status: 'PENDENTE',
				cultura_id: 'cul-soja',
				quantidade_sacas: 50,
			})
			prisma.colheitas.findUnique.mockResolvedValue({
				id: 'col-1',
				cultura_id: 'cul-milho',
				culturas: { nome: 'Milho' },
			})

			await expect(
				estoqueService.confirmarEntregaArrendamento({
					role: 'ADMIN',
					entregaId: 'ent-1',
					colheitaId: 'col-1',
				}),
			).rejects.toMatchObject({ statusCode: 400 })
		})
	})

	describe('marcarEntregaArrendamento', () => {
		it('marca como NAO_ENTREGUE e resolve notificação', async () => {
			estoqueRepository.buscarEntregaPorId.mockResolvedValue({
				id: 'ent-2',
				status: 'PENDENTE',
			})
			estoqueRepository.atualizarEntrega.mockResolvedValue({ id: 'ent-2', status: 'NAO_ENTREGUE' })

			const resultado = await estoqueService.marcarEntregaArrendamento({
				role: 'ADMIN',
				entregaId: 'ent-2',
				status: 'NAO_ENTREGUE',
			})

			expect(resultado.status).toBe('NAO_ENTREGUE')
		})
	})
})
