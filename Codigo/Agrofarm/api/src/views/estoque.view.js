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
    renderEntregaArrendamento(entrega) {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const dataEntrega = entrega.data ? new Date(entrega.data) : null
        if (dataEntrega) dataEntrega.setHours(0, 0, 0, 0)

        return {
            id: entrega.id,
            fazendaId: entrega.fazenda_id,
            fazenda: entrega.fazendas
                ? { id: entrega.fazendas.id, nome: entrega.fazendas.nome }
                : null,
            cultura: entrega.culturas
                ? { id: entrega.culturas.id, nome: entrega.culturas.nome, cor: entrega.culturas.cor }
                : null,
            quantidadeSacas: Number(entrega.quantidade_sacas ?? 0),
            data: entrega.data?.toISOString?.().slice(0, 10) ?? entrega.data,
            status: entrega.status,
            colheitaId: entrega.colheita_id ?? null,
            vencida: entrega.status === 'PENDENTE' && dataEntrega ? dataEntrega <= hoje : false,
        }
    },
    renderArrendamentosPendentes(items) {
        return (items ?? []).map((item) => estoqueView.renderEntregaArrendamento(item))
    },
    renderDetalhe(row) {
        return {
            ...estoqueView.renderLote(row),
            movimentacoes: (row.movimentacoes ?? []).map(renderMovimentacao),
        }
    },
}
