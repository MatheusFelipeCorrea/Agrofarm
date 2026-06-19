/** Espelha a lógica de relevância climática da API (noticia.clima.js). */
const TERMOS_CLIMA = [
  "el nino", "elnino", "la nina", "lanina", "fenomeno el nino", "enos", "enso",
  "previsao do tempo", "frente fria", "onda de calor", "estiagem", "deficit hidrico",
  "geada", "granizo", "volume de chuva", "distribuicao de chuva", "meteorolog",
  "inmet", "cptec", "climatempo", "chuvas", "chuva", "precipitacao", "temperatura",
  "umidade", "vento", "previsao", "clima", "climatico", "anomalia de chuva",
];

const MIN_SCORE_CLIMA = 3;

function normalizarBusca(texto) {
  return String(texto ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function calcularScoreClimaLocal(item) {
  if (item?.scoreClima != null) return Number(item.scoreClima) || 0;

  const texto = normalizarBusca(`${item?.titulo ?? ""} ${item?.descricao ?? ""}`);
  let score = 0;
  for (const termo of TERMOS_CLIMA) {
    const t = normalizarBusca(termo);
    if (texto.includes(t)) {
      score += termo.includes("nino") || termo.includes("nina") || termo.includes("enso") ? 6 : 2;
    }
  }
  return score;
}

function pertenceAoClimaLocal(item) {
  const score = calcularScoreClimaLocal(item);
  if (score >= MIN_SCORE_CLIMA) return true;
  if (item?.categoria === "CLIMA" && score >= 2) return true;
  return false;
}

export function filtrarNoticiasLocal(itens, { categoria, busca }) {
  let lista = itens ?? [];

  if (categoria === "CLIMA") {
    lista = lista.filter(pertenceAoClimaLocal);
    lista = [...lista].sort((a, b) => calcularScoreClimaLocal(b) - calcularScoreClimaLocal(a));
  } else if (categoria && categoria !== "TODAS") {
    lista = lista.filter((item) => item.categoria === categoria && !pertenceAoClimaLocal(item));
  }

  const termo = normalizarBusca(busca);
  if (termo) {
    lista = lista.filter((item) => {
      const texto = `${item.titulo} ${item.descricao} ${item.fonte?.nome ?? ""}`;
      return normalizarBusca(texto).includes(termo);
    });
  }

  return lista;
}
