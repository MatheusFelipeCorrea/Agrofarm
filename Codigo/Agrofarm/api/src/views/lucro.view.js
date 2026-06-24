export const lucroView = {
    render(lucro) {
        const colheita = lucro.colheitas
        const fazenda = colheita?.fazendas
        const cultura = colheita?.culturas

        const quantidadeSacas = Number(lucro.quantidade_sacas)
        const valorUnitario = Number(lucro.valor_unitario)

        return {
            id: lucro.id,
            origem: lucro.origem ?? 'VENDA_COLHEITA',
            colheitaId: lucro.colheita_id ?? null,
            fazendaId: fazenda?.id ?? null,
            quantidadeSacas,
            valorUnitario,
            total: quantidadeSacas * valorUnitario,
            comprador: lucro.comprador,
            data: lucro.data?.toISOString?.().slice(0, 10) ?? lucro.data,
            fazenda: fazenda ? { id: fazenda.id, nome: fazenda.nome } : undefined,
            cultura: cultura
                ? { id: cultura.id, nome: cultura.nome, cor: cultura.cor }
                : undefined,
            colheita: colheita
                ? {
                      id: colheita.id,
                      ano: colheita.ano,
                      dataColheita:
                          colheita.data_colheita?.toISOString?.().slice(0, 10) ??
                          colheita.data_colheita,
                  }
                : undefined,
            criadoEm: lucro.criado_em?.toISOString?.() ?? lucro.criado_em,
            somenteLeitura: false,
        }
    },

    renderMany(lucros) {
        return lucros.map((l) => lucroView.render(l))
    },

    renderTotal({ totalLucro }) {
        return {
            totalLucro: Number(totalLucro),
        }
    },
}
