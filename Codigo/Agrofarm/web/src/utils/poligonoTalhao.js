/** Normaliza polígono da API (cultura_nome/cor) para uso nos selects e lembretes. */
export function normalizarPoligonoApi(poligono) {
  if (!poligono) return poligono;
  const cultura =
    poligono.cultura ??
    (poligono.cultura_nome
      ? {
          id: poligono.cultura_id,
          nome: poligono.cultura_nome,
          cor: poligono.cultura_cor,
        }
      : null);

  return { ...poligono, cultura };
}

/** Nome exibido do talhão (nome do polígono ou cultura plantada). */
export function nomeTalhaoExibicao(poligono) {
  const p = normalizarPoligonoApi(poligono);
  const culturaNome = p.cultura?.nome?.trim();
  return p.nome?.trim() || culturaNome || "";
}

/** Rótulo do select: talhão + cultura plantada quando forem distintos. */
export function rotuloTalhaoSelect(poligono) {
  const p = normalizarPoligonoApi(poligono);
  const talhao = nomeTalhaoExibicao(p);
  const cultura = p.cultura?.nome?.trim();

  if (!talhao) return "Sem nome";
  if (cultura && cultura !== talhao) {
    return `${talhao} — cultura: ${cultura}`;
  }
  if (cultura) {
    return `${talhao} (cultura: ${cultura})`;
  }
  return talhao;
}
