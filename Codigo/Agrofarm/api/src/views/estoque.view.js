function renderMovimentacao(m) {
    return {
        id: m.id,
        tipo: m.tipo,
        quantidadeSacas: m.quantidadeSacas,
        data: m.data instanceof Date ? m.data.toISOString().slice(0, 10) : m.data,
        dataHora: m.dataHora,
        descricao: m.descricao,
    }
}

function renderLote(row) {
    return {
        colheitaId: row.colheitaId,
        lote: row.lote,
        ano: row.ano,
        dataColheita: row.dataColheita instanceof Date
            ? row.dataColheita.toISOString().slice(0, 10)
            : row.dataColheita,
        fazenda: row.fazenda,
        cultura: row.cultura,
        produzidas: row.produzidas,
        vendidas: row.vendidas,
        emEstoque: row.emEstoque,
        localizacao: row.localizacao,
        ultimaMovimentacao: row.ultimaMovimentacao,
        status: row.status,
    }
}

export const estoqueView = {
    renderLote,
    renderMany(rows) {
        return rows.map((row) => estoqueView.renderLote(row))
    },
    renderResumo(resumo) {
        return {
            totalEmEstoque: resumo.totalEmEstoque,
            totalVendido: resumo.totalVendido,
            lotesEstoqueBaixo: resumo.lotesEstoqueBaixo,
        }
    },
    renderMovimentacoesRecentes(items) {
        return items
    },
    renderDetalhe(row) {
        return {
            ...estoqueView.renderLote(row),
            movimentacoes: (row.movimentacoes ?? []).map(renderMovimentacao),
        }
    },
}
