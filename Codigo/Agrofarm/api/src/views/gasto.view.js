export const gastoView = {
  render(gasto) {
    const colheita = gasto.colheitas;
    const fazenda = colheita?.fazendas;
    const cultura = colheita?.culturas;

    return {
      id: gasto.id,
      colheitaId: gasto.colheita_id,
      tipo: gasto.tipo,
      tipoPersonalizado: gasto.tipo_personalizado ?? null,
      valor: Number(gasto.valor),
      data: gasto.data?.toISOString?.().slice(0, 10) ?? gasto.data,
      vencimento: gasto.data_vencimento?.toISOString?.().slice(0, 10) ?? gasto.data_vencimento ?? null,
      dataVencimento: gasto.data_vencimento?.toISOString?.().slice(0, 10) ?? gasto.data_vencimento ?? null,
      status: gasto.status,
      descricao: gasto.descricao ?? null,
      fazenda: fazenda ? { id: fazenda.id, nome: fazenda.nome } : undefined,
      cultura: cultura ? { id: cultura.id, nome: cultura.nome, cor: cultura.cor } : undefined,
      colheita: colheita
        ? {
            id: colheita.id,
            ano: colheita.ano,
            dataColheita: colheita.data_colheita?.toISOString?.().slice(0, 10) ?? colheita.data_colheita,
          }
        : undefined,
      criadoEm: gasto.criado_em?.toISOString?.() ?? gasto.criado_em,
      atualizadoEm: gasto.atualizado_em?.toISOString?.() ?? gasto.atualizado_em,
    };
  },
  renderMany(gastos) {
    return gastos.map((g) => gastoView.render(g));
  },
  renderResumo(resumo) {
    return {
      totalGasto: Number(resumo?.totalGasto ?? 0),
      totalPago: Number(resumo?.totalPago ?? 0),
      totalPendente: Number(resumo?.totalPendente ?? 0),
    };
  },
};

