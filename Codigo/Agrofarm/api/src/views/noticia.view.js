function formatarData(iso) {
  if (!iso) return null;
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function renderItem(item) {
  if (!item) return null;
  return {
    id: item.id,
    titulo: item.titulo,
    descricao: item.descricao,
    link: item.link,
    imagemUrl: item.imagemUrl ?? null,
    categoria: item.categoria,
    scoreClima: item.scoreClima ?? 0,
    dataPublicacao: item.dataPublicacao?.toISOString?.() ?? item.dataPublicacao,
    dataFormatada: formatarData(item.dataPublicacao),
    minutosLeitura: item.minutosLeitura,
    fonte: item.fonte,
  };
}

function renderListagem(payload) {
  return {
    destaque: renderItem(payload.destaque),
    items: (payload.items ?? []).map(renderItem),
    meta: payload.meta,
    temas: payload.temas,
    fontes: payload.fontes,
    categorias: payload.categorias,
    atualizadoEm: payload.atualizadoEm?.toISOString?.() ?? payload.atualizadoEm,
  };
}

export const noticiaView = {
  renderListagem,
};
