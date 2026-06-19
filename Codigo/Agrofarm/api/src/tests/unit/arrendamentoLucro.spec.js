import { describe, expect, it } from 'vitest'
import {
    addPeriodoArrendamento,
    listarDatasRecebimentoAteHoje,
} from '../../shared/fazenda/arrendamentoLucro.js'

describe('arrendamentoLucro', () => {
    it('lista recebimentos mensais ate a data limite', () => {
        const datas = listarDatasRecebimentoAteHoje({
            dataInicio: '2026-01-15',
            periodicidade: 'MENSAL',
            ate: new Date('2026-03-20'),
        })

        expect(datas).toEqual(['2026-01-15', '2026-02-15', '2026-03-15'])
    })

    it('avança periodo semestral', () => {
        const proximo = addPeriodoArrendamento(new Date(2026, 0, 10), 'SEMESTRAL')
        expect(proximo.getFullYear()).toBe(2026)
        expect(proximo.getMonth()).toBe(6)
        expect(proximo.getDate()).toBe(10)
    })
})
