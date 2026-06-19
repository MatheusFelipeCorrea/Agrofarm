/** Termos com peso para detectar notícias realmente ligadas ao clima (agro). */
const TERMOS_CLIMA = [
  { termo: "el nino", peso: 8 },
  { termo: "elnino", peso: 8 },
  { termo: "la nina", peso: 8 },
  { termo: "lanina", peso: 8 },
  { termo: "fenomeno el nino", peso: 9 },
  { termo: "fenomeno la nina", peso: 9 },
  { termo: "enos", peso: 7 },
  { termo: "enso", peso: 7 },
  { termo: "fase neutra", peso: 5 },
  { termo: "neutralidade", peso: 5 },
  { termo: "dipolo", peso: 6 },
  { termo: "previsao do tempo", peso: 6 },
  { termo: "previsao meteorolog", peso: 6 },
  { termo: "previsao climat", peso: 6 },
  { termo: "frente fria", peso: 5 },
  { termo: "frente quente", peso: 5 },
  { termo: "onda de calor", peso: 6 },
  { termo: "onda de frio", peso: 6 },
  { termo: "deficit hidrico", peso: 6 },
  { termo: "deficit hídrico", peso: 6 },
  { termo: "estiagem", peso: 6 },
  { termo: "seca", peso: 4 },
  { termo: "geada", peso: 6 },
  { termo: "granizo", peso: 6 },
  { termo: "temporal", peso: 5 },
  { termo: "tempestade", peso: 5 },
  { termo: "ciclone", peso: 6 },
  { termo: "tornado", peso: 6 },
  { termo: "vendaval", peso: 5 },
  { termo: "raio", peso: 4 },
  { termo: "volume de chuva", peso: 5 },
  { termo: "volumes de chuva", peso: 5 },
  { termo: "distribuicao de chuva", peso: 5 },
  { termo: "distribuição de chuvas", peso: 5 },
  { termo: "acumulado de chuva", peso: 5 },
  { termo: "chuva volumosa", peso: 5 },
  { termo: "chuvas", peso: 3 },
  { termo: "chuva", peso: 3 },
  { termo: "precipitacao", peso: 4 },
  { termo: "precipitação", peso: 4 },
  { termo: "meteorolog", peso: 4 },
  { termo: "meteorologia", peso: 4 },
  { termo: "climatolog", peso: 5 },
  { termo: "inmet", peso: 5 },
  { termo: "cptec", peso: 5 },
  { termo: "inpe", peso: 5 },
  { termo: "climatempo", peso: 5 },
  { termo: "mapa de chuva", peso: 5 },
  { termo: "indice de vegetacao", peso: 4 },
  { termo: "stress hidrico", peso: 5 },
  { termo: "stress térmico", peso: 5 },
  { termo: "stress termico", peso: 5 },
  { termo: "umidade do ar", peso: 4 },
  { termo: "umidade relativa", peso: 4 },
  { termo: "temperatura", peso: 3 },
  { termo: "maxima", peso: 2 },
  { termo: "minima", peso: 2 },
  { termo: "vento", peso: 3 },
  { termo: "rajada", peso: 4 },
  { termo: "previsao", peso: 3 },
  { termo: "previsão", peso: 3 },
  { termo: "clima", peso: 2 },
  { termo: "climatico", peso: 3 },
  { termo: "climática", peso: 3 },
  { termo: "climaticos", peso: 3 },
  { termo: "anomalia de temperatura", peso: 6 },
  { termo: "anomalia de chuva", peso: 6 },
  { termo: "bloqueio atmosferico", peso: 6 },
  { termo: "bloqueio atmosférico", peso: 6 },
];

/** Mínimo para entrar no filtro "Clima". */
export const MIN_SCORE_CLIMA_FILTRO = 3;

/** Mínimo para classificar a notícia como categoria CLIMA. */
export const MIN_SCORE_CLIMA_CATEGORIA = 4;

export function normalizarTextoClima(texto) {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function calcularScoreClima(textoOuCampos) {
  const texto =
    typeof textoOuCampos === "string"
      ? textoOuCampos
      : `${textoOuCampos?.titulo ?? ""} ${textoOuCampos?.descricao ?? ""} ${(textoOuCampos?.categoriasRss ?? []).join(" ")}`;

  const normalizado = normalizarTextoClima(texto);
  if (!normalizado.trim()) return 0;

  let score = 0;
  const termosUsados = new Set();

  for (const { termo, peso } of TERMOS_CLIMA) {
    const chave = normalizarTextoClima(termo);
    if (termosUsados.has(chave)) continue;
    if (normalizado.includes(chave)) {
      score += peso;
      termosUsados.add(chave);
    }
  }

  return score;
}

export function pertenceAoClima(item) {
  const score = item?.scoreClima ?? calcularScoreClima(item);
  if (score >= MIN_SCORE_CLIMA_FILTRO) return true;
  if (item?.categoria === "CLIMA" && score >= 2) return true;
  return false;
}
