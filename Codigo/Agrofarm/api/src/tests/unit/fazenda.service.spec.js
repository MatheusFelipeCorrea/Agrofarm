import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../repositories/fazenda.repository.js', () => ({
	fazendaRepository: {
		buscarTodos: vi.fn(),
		buscarTodosPorUsuario: vi.fn(),
		usuarioTemVinculo: vi.fn(),
		buscarPorId: vi.fn(),
		buscarPorNome: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		contarVinculos: vi.fn(),
		sumAreaHectaresByFazenda: vi.fn(),
		sumAreaHectaresByFazendaIds: vi.fn(),
	},
}))

const { fazendaService } = await import('../../services/fazenda.service.js')
const { fazendaRepository } = await import('../../repositories/fazenda.repository.js')

describe('fazendaService', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('lista todas as fazendas para ADMIN', async () => {
		const fazendas = [{ id: 'faz-1' }]
		fazendaRepository.buscarTodos.mockResolvedValue(fazendas)
		fazendaRepository.sumAreaHectaresByFazendaIds.mockResolvedValue(new Map([['faz-1', 12.5]]))

		const resultado = await fazendaService.listarTodas({ role: 'ADMIN', id: 'admin-1' })

		expect(resultado.fazendas).toEqual(fazendas)
		expect(resultado.hectaresPorFazenda.get('faz-1')).toBe(12.5)
		expect(fazendaRepository.buscarTodos).toHaveBeenCalledTimes(1)
		expect(fazendaRepository.buscarTodosPorUsuario).not.toHaveBeenCalled()
	})

	it('lista apenas fazendas vinculadas para FUNCIONARIO', async () => {
		const fazendas = [{ id: 'faz-2' }]
		fazendaRepository.buscarTodosPorUsuario.mockResolvedValue(fazendas)
		fazendaRepository.sumAreaHectaresByFazendaIds.mockResolvedValue(new Map())

		const resultado = await fazendaService.listarTodas({ role: 'FUNCIONARIO', id: 'user-1' })

		expect(resultado.fazendas).toEqual(fazendas)
		expect(fazendaRepository.buscarTodosPorUsuario).toHaveBeenCalledWith('user-1')
		expect(fazendaRepository.buscarTodos).not.toHaveBeenCalled()
	})

	it('bloqueia acesso a fazenda sem vinculo para FUNCIONARIO', async () => {
		fazendaRepository.buscarPorId.mockResolvedValue({ id: 'faz-3' })
		fazendaRepository.usuarioTemVinculo.mockResolvedValue(false)

		await expect(
			fazendaService.buscarPorId('faz-3', { role: 'FUNCIONARIO', id: 'user-2' }),
		).rejects.toMatchObject({ message: 'Acesso negado a esta fazenda', statusCode: 403 })

		expect(fazendaRepository.usuarioTemVinculo).toHaveBeenCalledWith('user-2', 'faz-3')
	})

	it('permite acesso a fazenda vinculada para FUNCIONARIO', async () => {
		const fazenda = { id: 'faz-4' }
		fazendaRepository.buscarPorId.mockResolvedValue(fazenda)
		fazendaRepository.usuarioTemVinculo.mockResolvedValue(true)
		fazendaRepository.sumAreaHectaresByFazenda.mockResolvedValue(8)

		const resultado = await fazendaService.buscarPorId('faz-4', {
			role: 'FUNCIONARIO',
			id: 'user-3',
		})

		expect(resultado).toEqual({ fazenda, hectaresMapeados: 8 })
		expect(fazendaRepository.usuarioTemVinculo).toHaveBeenCalledWith('user-3', 'faz-4')
	})
})
