/**
 * Destaca trechos de ação/recomendação em markdown (**texto**) para render verde no InsightMarkdown.
 */
const PADROES_ACAO =
  /(considere\s+reforçar(?:\s+(?:o\s+|os\s+|a\s+|as\s+)?investimentos?(?:\s+em\s+[\wÀ-ú][\wÀ-ú\s-]*)?)?|reforçar\s+investimentos?(?:\s+em\s+[\wÀ-ú][\wÀ-ú\s-]*)?|aumentar\s+investimentos?(?:\s+em\s+[\wÀ-ú][\wÀ-ú\s-]*)?|recomenda-se\s+[\wÀ-ú0-9\s$,./%-]+|avalie\s+vender[\wÀ-ú0-9\s$,./%-]+|melhor\s+custo-benefício[\wÀ-ú\s-]*|priorize\s+[\wÀ-ú\s-]+|aproveite\s+[\wÀ-ú\s-]+|negocie\s+[\wÀ-ú\s-]+)/gi;

export function destacarAcoesMarkdown(texto) {
  if (!texto?.trim()) return texto;

  return texto.replace(PADROES_ACAO, (trecho) => {
    const limpo = trecho.trim();
    if (!limpo || /^\*\*.+\*\*$/.test(limpo)) return trecho;
    return `**${limpo}**`;
  });
}

/** Quebra texto em trechos normais e trechos de ação (verde inline). */
export function splitTrechosAcao(texto) {
  if (!texto?.trim()) return [{ text: texto ?? "", highlight: false }];

  const partes = [];
  let ultimo = 0;
  const regex = new RegExp(PADROES_ACAO.source, PADROES_ACAO.flags);

  for (const match of texto.matchAll(regex)) {
    if (match.index > ultimo) {
      partes.push({ text: texto.slice(ultimo, match.index), highlight: false });
    }
    partes.push({ text: match[0], highlight: true });
    ultimo = match.index + match[0].length;
  }

  if (ultimo < texto.length) {
    partes.push({ text: texto.slice(ultimo), highlight: false });
  }

  return partes.length ? partes : [{ text: texto, highlight: false }];
}
