import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../repositories/lembrete.repository.js', () => ({
	lembreteRepository: {
		buscarPorId: vi.fn(),
		buscarTodosComFiltros: vi.fn(),
		criar: vi.fn(),
		atualizar: vi.fn(),
		remover: vi.fn(),
		removerTodos: vi.fn(),
	},
}))

vi.mock('../../services/whatsapp.service.js', () => ({
	whatsappService: {
		enviarTexto: vi.fn(),
	},
}))

vi.mock('../../services/notificacao.service.js', () => ({
	notificacaoService: {
		notificarNovoLembrete: vi.fn().mockResolvedValue(undefined),
	},
}))

vi.mock('../../shared/fazenda/fazendaOperacao.js', () => ({
	assertFazendaOperavelPorId: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../database/client.js', () => ({
	prisma: {
		colheitas: { findUnique: vi.fn() },
		poligonos_fazenda: { findUnique: vi.fn() },
		gastos: { findMany: vi.fn().mockResolvedValue([]) },
		lembretes: { findMany: vi.fn().mockResolvedValue([]) },
	},
}))

const { lembreteService } = await import('../../services/lembrete.service.js')
const { lembreteRepository } = await import('../../repositories/lembrete.repository.js')
const { whatsappService } = await import('../../services/whatsapp.service.js')
const { notificacaoService } = await import('../../services/notificacao.service.js')
const { prisma } = await import('../../database/client.js')

const usuarioAdmin = { id: 'admin-1', role: 'ADMIN', fazendaIds: ['faz-1'] }
const usuarioFunc = { id: 'func-1', role: 'FUNCIONARIO', fazendaIds: ['faz-1'] }

describe('lembreteService', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('enviarLembrete', () => {
		it('envia lembrete e atualiza status para ENVIADO', async () => {
			const lembrete = {
				id: 'lembrete-1',
				titulo: 'Aplicar fertilizante',
				descricao: 'NPK 20-20-20',
				data_lembrete: new Date('2026-04-08T10:00:00.000Z'),
				telefone_whatsapp: '31999998888',
				status: 'PENDENTE',
				recorrencia: 'NENHUMA',
				usuarios: null,
			}

			lembreteRepository.buscarPorId.mockResolvedValue(lembrete)
			whatsappService.enviarTexto.mockResolvedValue({})
			lembreteRepository.atualizar.mockResolvedValue({ ...lembrete, status: 'ENVIADO' })

			const resultado = await lembreteService.enviarLembrete('lembrete-1')

			expect(whatsappService.enviarTexto).toHaveBeenCalledTimes(1)
			expect(lembreteRepository.atualizar).toHaveBeenCalledWith('lembrete-1', {
				status: 'ENVIADO',
				enviado_em: expect.any(Date),
				erro_envio: null,
			})
			expect(resultado.status).toBe('ENVIADO')
		})

		it('falha ao enviar quando não houver telefone', async () => {
			lembreteRepository.buscarPorId.mockResolvedValue({
				id: 'lembrete-2',
				titulo: 'Irrigação',
				descricao: null,
				data_lembrete: new Date('2026-04-08T10:00:00.000Z'),
				telefone_whatsapp: null,
				status: 'PENDENTE',
				recorrencia: 'NENHUMA',
				usuarios: { telefone: null },
			})

			await expect(lembreteService.enviarLembrete('lembrete-2')).rejects.toMatchObject({
				statusCode: 400,
			})
			expect(whatsappService.enviarTexto).not.toHaveBeenCalled()
		})

		it('não altera status para lembrete recorrente', async () => {
			const lembrete = {
				id: 'lembrete-3',
				titulo: 'Semanal',
				data_lembrete: new Date('2026-04-08T10:00:00.000Z'),
				telefone_whatsapp: '31999998888',
				status: 'PENDENTE',
				recorrencia: 'SEMANAL',
			}
			lembreteRepository.buscarPorId.mockResolvedValue(lembrete)
			whatsappService.enviarTexto.mockResolvedValue({})
			lembreteRepository.atualizar.mockResolvedValue(lembrete)

			await lembreteService.enviarLembrete('lembrete-3')

			expect(lembreteRepository.atualizar).toHaveBeenCalledWith('lembrete-3', {
				enviado_em: lembrete.data_lembrete,
				erro_envio: null,
			})
		})
	})

	describe('criar', () => {
		it('cria lembrete e dispara notificação', async () => {
			const payload = {
				usuario: usuarioAdmin,
				usuarioId: 'admin-1',
				titulo: 'Pulverizar',
				dataLembrete: new Date('2026-05-01'),
				fazendaId: 'faz-1',
			}
			const criado = { id: 'novo-1', ...payload, status: 'PENDENTE' }
			lembreteRepository.criar.mockResolvedValue(criado)

			const resultado = await lembreteService.criar(payload)

			expect(resultado).toEqual(criado)
			expect(notificacaoService.notificarNovoLembrete).toHaveBeenCalledWith({ lembrete: criado })
		})

		it('bloqueia FUNCIONARIO em fazenda sem vínculo', async () => {
			await expect(
				lembreteService.criar({
					usuario: usuarioFunc,
					usuarioId: 'func-1',
					titulo: 'Teste',
					dataLembrete: new Date(),
					fazendaId: 'faz-outra',
				}),
			).rejects.toMatchObject({ statusCode: 403 })
		})

		it('valida colheita vinculada à fazenda', async () => {
			prisma.colheitas.findUnique.mockResolvedValue({ fazenda_id: 'faz-1' })

			await lembreteService.criar({
				usuario: usuarioAdmin,
				usuarioId: 'admin-1',
				titulo: 'Colheita',
				dataLembrete: new Date(),
				colheitaId: 'col-1',
				fazendaId: 'faz-1',
			})

			expect(lembreteRepository.criar).toHaveBeenCalledWith(
				expect.objectContaining({ colheita_id: 'col-1', fazenda_id: 'faz-1' }),
			)
		})
	})

	describe('buscarPorId', () => {
		it('lança 404 quando não encontrado', async () => {
			lembreteRepository.buscarPorId.mockResolvedValue(null)

			await expect(lembreteService.buscarPorId('inexistente')).rejects.toMatchObject({
				statusCode: 404,
			})
		})
	})

	describe('removerTodos', () => {
		it('permite apenas ADMIN', async () => {
			await expect(lembreteService.removerTodos({ usuario: usuarioFunc })).rejects.toMatchObject({
				statusCode: 403,
			})
		})

		it('remove todos e retorna contagem', async () => {
			lembreteRepository.removerTodos.mockResolvedValue({ count: 5 })

			const resultado = await lembreteService.removerTodos({ usuario: usuarioAdmin })

			expect(resultado.totalRemovidos).toBe(5)
		})
	})

	describe('updateStatus', () => {
		it('atualiza status válido', async () => {
			lembreteRepository.buscarPorId.mockResolvedValue({ id: 'l-1' })
			lembreteRepository.atualizar.mockResolvedValue({ id: 'l-1', status: 'CANCELADO' })

			const resultado = await lembreteService.updateStatus('l-1', 'CANCELADO')

			expect(resultado.status).toBe('CANCELADO')
		})

		it('rejeita status inválido', async () => {
			await expect(lembreteService.updateStatus('l-1', 'INVALIDO')).rejects.toMatchObject({
				statusCode: 400,
			})
		})
	})

	describe('transformarGastoEmEvento', () => {
		it('mapeia gasto pendente como lembrete PENDENTE', () => {
			const evento = lembreteService.transformarGastoEmEvento({
				id: 'g-1',
				descricao: 'Defensivo',
				valor: 1500,
				status: 'PENDENTE',
				data_vencimento: new Date('2026-06-15'),
				colheita_id: 'col-1',
				colheitas: {
					ano: 2025,
					fazendas: { id: 'faz-1', nome: 'Fazenda' },
					culturas: { id: 'c1', nome: 'Soja', cor: '#000' },
				},
			})

			expect(evento.tipo).toBe('GASTO')
			expect(evento.titulo).toContain('Defensivo')
			expect(evento.valor).toBe(1500)
		})
	})

	describe('normalizarFiltroFazenda', () => {
		it('retorna null para ADMIN sem filtro', () => {
			expect(
				lembreteService.normalizarFiltroFazenda({
					fazendaId: 'all',
					role: 'ADMIN',
					fazendaIdsPermitidas: [],
				}),
			).toBeNull()
		})

		it('retorna array vazio para funcionário sem fazendas', () => {
			expect(
				lembreteService.normalizarFiltroFazenda({
					role: 'FUNCIONARIO',
					fazendaIdsPermitidas: [],
				}),
			).toEqual([])
		})
	})
})
