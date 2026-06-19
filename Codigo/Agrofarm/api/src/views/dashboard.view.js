export const dashboardView = {
  render: ({ recomendacao, producaoPorCultura, sacasEmEstoque, extratoRecente, cards }) => ({
    recomendacao: recomendacao ?? null,
    producaoPorCultura,
    sacasEmEstoque,
    extratoRecente: extratoRecente.map((movimento) => ({
      id: movimento.id,
      tipo: movimento.tipo,
      valor: Number(movimento.valor ?? 0),
      data: movimento.data,
      criadoEm: movimento.criadoEm ?? null,
      titulo: movimento.titulo ?? movimento.descricao ?? "Movimentação",
      descricao: movimento.descricao ?? null,
      fazendaNome: movimento.fazendaNome ?? null,
      culturaNome: movimento.culturaNome ?? null,
      categoria: movimento.categoria ?? null,
      comprador: movimento.comprador ?? null,
      documento: movimento.documento ?? null,
      formaPagamento: movimento.formaPagamento ?? null,
      observacao: movimento.observacao ?? null,
    })),
    cards: {
      saldoTotal: Number(cards.saldoTotal ?? 0),
      cotacaoAtual: cards.cotacaoAtual,
      lucroTotal: Number(cards.lucroTotal ?? 0),
      custosTotais: Number(cards.custosTotais ?? 0),
    },
  }),
};