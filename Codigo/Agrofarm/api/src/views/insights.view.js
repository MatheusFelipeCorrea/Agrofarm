function renderCard(card) {
  if (!card) return null;
  return {
    tipo: card.tipo,
    titulo: card.titulo,
    texto: card.texto,
    recomendacao: card.recomendacao,
    dados: card.dados,
    escopo: card.escopo,
    escopoLabel: card.escopoLabel,
    insuficiente: card.insuficiente,
    origem: card.origem,
    geradoEm: card.geradoEm instanceof Date ? card.geradoEm.toISOString() : card.geradoEm,
    atualizavel: Boolean(card.atualizavel),
  };
}

export const insightsView = {
  renderPainel(payload) {
    return {
      escopo: payload.escopo,
      escopoLabel: payload.escopoLabel,
      fazendaId: payload.fazendaId,
      fazendasCarousel: payload.fazendasCarousel ?? [],
      analisePorFazenda: payload.analisePorFazenda ?? [],
      geminiDisponivel: payload.geminiDisponivel,
      intervaloAutoMinutos: payload.intervaloAutoMinutos,
      saudacao: renderCard(payload.saudacao),
      estoque: renderCard(payload.estoque),
      lucros: renderCard(payload.lucros),
      analiseFazendas: renderCard(payload.analiseFazendas),
      fazendaFixa: renderCard(payload.fazendaFixa),
      dicaDia: renderCard(payload.dicaDia),
    };
  },
  renderRefresh({ atualizados }) {
    return { atualizados: atualizados.map(renderCard) };
  },
};
