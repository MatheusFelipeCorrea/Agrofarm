import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../database/client.js', () => ({
    prisma: {
        fazendas: { findUnique: vi.fn() },
        colheitas: { findUnique: vi.fn() },
    },
}))

const { prisma } = await import('../../database/client.js')
const {
    TIPO_FAZENDA_SOMENTE_LEITURA,
    isFazendaSomenteLeitura,
    podeOperarFazenda,
    assertFazendaOperavel,
    assertFazendaOperavelPorId,
    assertFazendaOperavelPorColheitaId,
} = await import('../../shared/fazenda/fazendaOperacao.js')

describe('fazendaOperacao', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('identifica fazenda arrendada para terceiros como somente leitura', () => {
        expect(isFazendaSomenteLeitura(TIPO_FAZENDA_SOMENTE_LEITURA)).toBe(true)
        expect(podeOperarFazenda(TIPO_FAZENDA_SOMENTE_LEITURA)).toBe(false)
        expect(podeOperarFazenda('PROPRIA')).toBe(true)
        expect(podeOperarFazenda('ARRENDADA_DE_TERCEIROS')).toBe(true)
    })

    it('assertFazendaOperavel bloqueia tipo somente leitura', () => {
        expect(() =>
            assertFazendaOperavel({ id: 'f1', tipo: TIPO_FAZENDA_SOMENTE_LEITURA }),
        ).toThrowError(
            expect.objectContaining({
                statusCode: 403,
                message: expect.stringContaining('arrendada para terceiros'),
            }),
        )
    })

    it('assertFazendaOperavelPorId consulta o tipo no banco', async () => {
        prisma.fazendas.findUnique.mockResolvedValue({
            id: 'f1',
            tipo: TIPO_FAZENDA_SOMENTE_LEITURA,
        })

        await expect(assertFazendaOperavelPorId('f1')).rejects.toMatchObject({
            statusCode: 403,
        })
    })

    it('assertFazendaOperavelPorColheitaId resolve fazenda da colheita', async () => {
        prisma.colheitas.findUnique.mockResolvedValue({ id: 'c1', fazenda_id: 'f1' })
        prisma.fazendas.findUnique.mockResolvedValue({ id: 'f1', tipo: 'PROPRIA' })

        await expect(assertFazendaOperavelPorColheitaId('c1')).resolves.toMatchObject({
            id: 'c1',
            fazenda_id: 'f1',
        })
    })
})
