function toIso(valor) {
  if (!valor) return null;
  return valor instanceof Date ? valor.toISOString() : new Date(valor).toISOString();
}

export const chatbotView = {
  renderSessao: (row) => ({
    id: row.id,
    titulo: row.titulo,
    criadoEm: toIso(row.criado_em),
    atualizadoEm: toIso(row.atualizado_em),
  }),

  renderMensagem: (row) => ({
    id: row.id,
    papel: row.papel,
    conteudo: row.conteudo,
    criadoEm: toIso(row.criado_em),
    fonteResposta: row.metadados && typeof row.metadados === "object" && row.metadados.fonteResposta
      ? row.metadados.fonteResposta
      : null,
  }),

  renderManySessoes: (rows) => rows.map((r) => chatbotView.renderSessao(r)),

  renderManyMensagens: (rows) => rows.map((r) => chatbotView.renderMensagem(r)),

  renderResumoPainel: (ctx) => {
    const g = ctx?.resumoGeral ?? {};
    return {
      fazendas: (ctx?.fazendas ?? []).map((f) => ({ id: f.id, nome: f.nome })),
      colheitasTotal: Number(g.colheitasTotal ?? ctx?.colheitasTotal ?? 0),
      totalLucros: Number(g.totalLucros ?? ctx?.totalLucros ?? 0),
      totalGastos: Number(g.totalGastos ?? ctx?.totalGastos ?? 0),
      saldoAproximado: Number(g.saldoAproximado ?? ctx?.saldoAproximado ?? 0),
      gastosPendentes: {
        quantidade: Number(g.gastosPendentes?.quantidade ?? 0),
        valorTotal: Number(g.gastosPendentes?.valorTotal ?? 0),
      },
    };
  },
};
