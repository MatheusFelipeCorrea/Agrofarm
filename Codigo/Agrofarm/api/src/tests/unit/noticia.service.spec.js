import { beforeEach, describe, expect, it, vi } from 'vitest'

const parseURL = vi.fn()

vi.mock('rss-parser', () => ({
	default: vi.fn().mockImplementation(() => ({
		parseURL,
	})),
}))

const { noticiaService } = await import('../../services/noticia.service.js')

function itemRss(overrides = {}) {
	return {
		title: 'Soja sobe no mercado',
		contentSnippet: 'Preços da soja registraram alta nesta semana.',
		link: 'https://exemplo.com/noticia-soja',
		isoDate: '2026-06-01T12:00:00.000Z',
		categories: ['Agronegócio'],
		...overrides,
	}
}

describe('noticiaService', () => {
	let clock = 1_000_000

	beforeEach(() => {
		vi.clearAllMocks()
		clock += 11 * 60 * 1000
		vi.spyOn(Date, 'now').mockReturnValue(clock)
	})

	it('lista notícias com destaque na primeira página sem filtros', async () => {
		parseURL.mockResolvedValue({
			items: [
				itemRss({ link: 'https://exemplo.com/a', title: 'Notícia A' }),
				itemRss({ link: 'https://exemplo.com/b', title: 'Notícia B' }),
			],
		})

		const resultado = await noticiaService.listar({ page: 1, pageSize: 12 })

		expect(resultado.items.length).toBeGreaterThan(0)
		expect(resultado.meta.page).toBe(1)
		expect(resultado.temas).toEqual(expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]))
		expect(resultado.fontes.length).toBeGreaterThan(0)
	})

	it('filtra por termo de busca', async () => {
		parseURL.mockResolvedValue({
			items: [
				itemRss({ link: 'https://exemplo.com/soja', title: 'Soja em alta' }),
				itemRss({ link: 'https://exemplo.com/milho', title: 'Milho estável' }),
			],
		})

		const resultado = await noticiaService.listar({ busca: 'soja', page: 1, pageSize: 12 })

		expect(resultado.items.every((n) => n.titulo.toLowerCase().includes('soja') || n.descricao.toLowerCase().includes('soja'))).toBe(true)
	})

	it('deduplica notícias pelo link priorizando fonte de maior prioridade', async () => {
		parseURL
			.mockResolvedValueOnce({
				items: [itemRss({ link: 'https://exemplo.com/duplicada', title: 'Versão A' })],
			})
			.mockResolvedValue({
				items: [itemRss({ link: 'https://exemplo.com/duplicada', title: 'Versão B' })],
			})

		const todas = await noticiaService.carregarTodasNoticias()
		const duplicadas = todas.filter((n) => n.link === 'https://exemplo.com/duplicada')

		expect(duplicadas).toHaveLength(1)
	})

	it('lança erro 503 quando nenhuma fonte retorna notícias', async () => {
		parseURL.mockResolvedValue({ items: [] })

		await expect(noticiaService.listar({ page: 1 })).rejects.toMatchObject({ statusCode: 503 })
	})

	it('não inclui destaque quando há filtro de categoria', async () => {
		parseURL.mockResolvedValue({
			items: [itemRss({ categories: ['Clima'], title: 'Chuva no Centro-Oeste' })],
		})

		const resultado = await noticiaService.listar({ categoria: 'CLIMA', page: 1 })

		expect(resultado.destaque).toBeNull()
	})
})
