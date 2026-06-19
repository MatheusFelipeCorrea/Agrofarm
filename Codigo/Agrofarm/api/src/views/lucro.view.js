function parseDateOnly(value) {
    if (!value) return null
    if (value instanceof Date) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate())
    }
    const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
    return new Date(y, m - 1, d)
}

const PERIODICIDADE_LABEL = {
    MENSAL: 'Mensal',
    SEMESTRAL: 'Semestral',
    ANUAL: 'Anual',
}

export const lucroView = {
    render(lucro) {
        const isArrendamento = lucro.origem === 'ARRENDAMENTO'
        const colheita = lucro.colheitas
        const fazenda = isArrendamento ? lucro.fazendas : colheita?.fazendas
        const cultura = colheita?.culturas

        const quantidadeSacas = Number(lucro.quantidade_sacas)
        const valorUnitario = Number(lucro.valor_unitario)

        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const dataParcela = lucro.data ? parseDateOnly(lucro.data) : null
        const vencida =
            isArrendamento && dataParcela ? dataParcela.getTime() <= hoje.getTime() : false

        return {
            id: lucro.id,
            origem: lucro.origem ?? 'VENDA_COLHEITA',
            statusRecebimento: isArrendamento ? (lucro.status_recebimento ?? 'PENDENTE') : null,
            parcelaVencida: vencida,
            colheitaId: lucro.colheita_id ?? null,
            fazendaId: lucro.fazenda_id ?? fazenda?.id ?? null,
            quantidadeSacas,
            valorUnitario,
            total: isArrendamento ? valorUnitario : quantidadeSacas * valorUnitario,
            comprador: lucro.comprador,
            data: lucro.data?.toISOString?.().slice(0, 10) ?? lucro.data,
            fazenda: fazenda ? { id: fazenda.id, nome: fazenda.nome } : undefined,
            cultura: isArrendamento
                ? { id: null, nome: 'Arrendamento', cor: '#0d4f3a' }
                : cultura
                  ? { id: cultura.id, nome: cultura.nome, cor: cultura.cor }
                  : undefined,
            colheita: isArrendamento
                ? {
                      id: null,
                      ano: null,
                      dataColheita: null,
                      label: 'Receita de arrendamento',
                  }
                : colheita
                  ? {
                        id: colheita.id,
                        ano: colheita.ano,
                        dataColheita:
                            colheita.data_colheita?.toISOString?.().slice(0, 10) ??
                            colheita.data_colheita,
                    }
                  : undefined,
            arrendamento: isArrendamento
                ? {
                      periodicidadeLabel: PERIODICIDADE_LABEL[lucro.fazendas?.arrendamento_periodicidade] ?? null,
                  }
                : null,
            criadoEm: lucro.criado_em?.toISOString?.() ?? lucro.criado_em,
            somenteLeitura: isArrendamento,
        }
    },

    renderMany(lucros) {
        return lucros.map((l) => lucroView.render(l))
    },

    renderTotal({ totalLucro, totalPendenteArrendamento = 0 }) {
        return {
            totalLucro: Number(totalLucro),
            totalPendenteArrendamento: Number(totalPendenteArrendamento ?? 0),
        }
    },
}
