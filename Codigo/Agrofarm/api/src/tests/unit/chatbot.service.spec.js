import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@google/generative-ai', () => ({
	GoogleGenerativeAI: vi.fn(),
}))

vi.mock('../../shared/gemini/geminiKey.js', () => ({
	resolverChaveGeminiChatbot: vi.fn(),
	validarFormatoChaveGemini: vi.fn(),
}))

vi.mock('../../repositories/chatbot.repository.js', () => ({
	chatbotRepository: {
		listarSessoesDoUsuario: vi.fn(),
		buscarSessaoDoUsuario: vi.fn(),
		listarMensagensAsc: vi.fn(),
		atualizarTituloSessao: vi.fn(),
		excluirSessao: vi.fn(),
		criarSessao: vi.fn(),
		criarMensagem: vi.fn(),
		tocarSessao: vi.fn(),
	},
}))

vi.mock('../../services/chatbot.context.js', () => ({
	montarContextoCompleto: vi.fn(),
}))

const { chatbotService } = await import('../../services/chatbot.service.js')
const { chatbotRepository } = await import('../../repositories/chatbot.repository.js')
const { montarContextoCompleto } = await import('../../services/chatbot.context.js')
const { resolverChaveGeminiChatbot, validarFormatoChaveGemini } = await import('../../shared/gemini/geminiKey.js')

const usuario = { id: 'user-1', nome: 'João', role: 'ADMIN', email: 'joao@test.com' }

const contextoMock = {
	fazendas: [{ id: 'faz-1', nome: 'Fazenda Norte' }],
	resumoGeral: { totalLucros: 10000, totalGastos: 4000, saldoAproximado: 6000, colheitasTotal: 3 },
	totalLucros: 10000,
	totalGastos: 4000,
	saldoAproximado: 6000,
	producaoPorCulturaAgregada: [{ nome: 'Soja', sacas: 500, area: 50, produtividade: 10 }],
	estoqueResumoAgregado: [{ nome: 'Soja', peso: 300, dataColheita: new Date('2026-05-01') }],
	ultimasMovimentacoesFinanceiras: [],
	lembretesRecentes: [],
	insumosRecentes: [],
	modulosAgroFarm: [{ modulo: 'Dashboard', rota: '/', paraQueServe: 'Visão geral' }],
	mercado: { dolar: { valor: 5.5 } },
}

describe('chatbotService', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		montarContextoCompleto.mockResolvedValue(contextoMock)
	})

	describe('obterResumoDados', () => {
		it('monta resumo do painel a partir do contexto', async () => {
			const resumo = await chatbotService.obterResumoDados(usuario)

			expect(montarContextoCompleto).toHaveBeenCalledWith(usuario)
			expect(resumo.fazendas).toHaveLength(1)
			expect(resumo.saldoAproximado).toBe(6000)
			expect(resumo.colheitasTotal).toBe(3)
		})
	})

	describe('listarSessoes', () => {
		it('lista sessões do usuário', async () => {
			chatbotRepository.listarSessoesDoUsuario.mockResolvedValue([
				{ id: 'sess-1', titulo: 'Dúvidas', atualizado_em: new Date() },
			])

			const sessoes = await chatbotService.listarSessoes(usuario, 10)

			expect(sessoes).toHaveLength(1)
			expect(chatbotRepository.listarSessoesDoUsuario).toHaveBeenCalledWith('user-1', 10)
		})
	})

	describe('listarMensagens', () => {
		it('retorna 404 para sessão inexistente', async () => {
			chatbotRepository.buscarSessaoDoUsuario.mockResolvedValue(null)

			await expect(chatbotService.listarMensagens(usuario, 'sess-x')).rejects.toMatchObject({
				statusCode: 404,
			})
		})

		it('lista mensagens da sessão', async () => {
			chatbotRepository.buscarSessaoDoUsuario.mockResolvedValue({ id: 'sess-1' })
			chatbotRepository.listarMensagensAsc.mockResolvedValue([
				{ id: 'm1', papel: 'usuario', conteudo: 'Olá' },
			])

			const mensagens = await chatbotService.listarMensagens(usuario, 'sess-1')

			expect(mensagens).toHaveLength(1)
		})
	})

	describe('renomearSessao', () => {
		it('rejeita título vazio', async () => {
			await expect(chatbotService.renomearSessao(usuario, 'sess-1', '   ')).rejects.toMatchObject({
				statusCode: 400,
			})
		})

		it('atualiza título da sessão', async () => {
			chatbotRepository.atualizarTituloSessao.mockResolvedValue({ count: 1 })
			chatbotRepository.buscarSessaoDoUsuario.mockResolvedValue({
				id: 'sess-1',
				titulo: 'Novo título',
			})

			const sessao = await chatbotService.renomearSessao(usuario, 'sess-1', 'Novo título')

			expect(sessao.titulo).toBe('Novo título')
		})
	})

	describe('excluirSessao', () => {
		it('lança 404 quando sessão não pertence ao usuário', async () => {
			chatbotRepository.excluirSessao.mockResolvedValue({ count: 0 })

			await expect(chatbotService.excluirSessao(usuario, 'sess-x')).rejects.toMatchObject({
				statusCode: 404,
			})
		})
	})

	describe('enviarMensagem', () => {
		it('responde consulta factual sem chamar Gemini', async () => {
			chatbotRepository.criarSessao.mockResolvedValue({ id: 'sess-nova', titulo: 'Saldo' })
			chatbotRepository.criarMensagem.mockImplementation(({ papel, conteudo }) => ({
				id: `msg-${papel}`,
				papel,
				conteudo,
				criado_em: new Date(),
			}))
			chatbotRepository.listarMensagensAsc.mockResolvedValue([
				{ id: 'msg-u', papel: 'usuario', conteudo: 'qual meu saldo?' },
			])
			resolverChaveGeminiChatbot.mockReturnValue(null)

			const resultado = await chatbotService.enviarMensagem(usuario, {
				conteudo: 'qual meu saldo?',
			})

			expect(resultado.meta.fonteResposta).toBe('consulta_rapida')
			expect(resultado.mensagemAssistente.conteudo).toContain('6.000')
			expect(chatbotRepository.tocarSessao).toHaveBeenCalled()
		})

		it('cria nova sessão quando sessaoId não informado', async () => {
			chatbotRepository.criarSessao.mockResolvedValue({ id: 'sess-nova' })
			chatbotRepository.criarMensagem.mockImplementation(({ papel, conteudo }) => ({
				id: `msg-${papel}`,
				papel,
				conteudo,
				criado_em: new Date(),
			}))
			chatbotRepository.listarMensagensAsc.mockResolvedValue([
				{ id: 'msg-u', papel: 'usuario', conteudo: 'qual meu saldo?' },
			])
			resolverChaveGeminiChatbot.mockReturnValue(null)

			const resultado = await chatbotService.enviarMensagem(usuario, {
				conteudo: 'qual meu saldo?',
			})

			expect(chatbotRepository.criarSessao).toHaveBeenCalled()
			expect(resultado.sessaoId).toBe('sess-nova')
		})

		it('usa fallback de dados quando não há chave Gemini', async () => {
			chatbotRepository.buscarSessaoDoUsuario.mockResolvedValue({ id: 'sess-1' })
			chatbotRepository.criarMensagem.mockImplementation(({ papel, conteudo }) => ({
				id: `msg-${papel}`,
				papel,
				conteudo,
				criado_em: new Date(),
			}))
			chatbotRepository.listarMensagensAsc.mockResolvedValue([
				{ id: 'msg-u', papel: 'usuario', conteudo: 'olá, pode me dar um panorama geral?' },
			])
			resolverChaveGeminiChatbot.mockReturnValue(null)

			const resultado = await chatbotService.enviarMensagem(usuario, {
				sessaoId: 'sess-1',
				conteudo: 'olá, pode me dar um panorama geral?',
			})

			expect(resultado.meta.fonteResposta).toBe('dados')
			expect(resultado.mensagemAssistente.conteudo).toContain('Fazenda Norte')
		})
	})

	describe('listarConsultasFactuais', () => {
		it('expõe catálogo de consultas rápidas', () => {
			const catalogo = chatbotService.listarConsultasFactuais()

			expect(Array.isArray(catalogo)).toBe(true)
			expect(catalogo.length).toBeGreaterThan(0)
		})
	})
})
