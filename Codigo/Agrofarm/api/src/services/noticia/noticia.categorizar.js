import {
  calcularScoreClima,
  MIN_SCORE_CLIMA_CATEGORIA,
  normalizarTextoClima,
} from "./noticia.clima.js";

const REGRAS_CATEGORIA = [
  {
    id: "MERCADO",
    palavras: [
      "cotacao",
      "cotação",
      "bolsa",
      "commodit",
      "exportacao",
      "exportação",
      "importacao",
      "importação",
      "dolar",
      "dólar",
      "cambio",
      "câmbio",
      "comercializ",
      "negociacao",
      "negociação",
      "arbitragem",
      "premio",
      "prêmio",
      "hedge",
      "soja",
      "milho",
      "cafe",
      "café",
      "algodao",
      "algodão",
      "trigo",
      "arroz",
      "boi gordo",
      "boi",
      "leite",
      "acucar",
      "açúcar",
      "preco do",
      "preço do",
      "valor da saca",
    ],
    peso: 2,
  },
  {
    id: "MANEJO",
    palavras: [
      "plantio",
      "colheita",
      "defensivo",
      "adubo",
      "fertiliz",
      "praga",
      "doenca",
      "doença",
      "herbicida",
      "fungicida",
      "inseticida",
      "manejo",
      "lavoura",
      "talhao",
      "talhão",
      "irriga",
      "semeadura",
      "fitossanit",
      "pulveriz",
    ],
    peso: 2,
  },
  {
    id: "TECNOLOGIA",
    palavras: [
      "tecnologia",
      "drone",
      "digital",
      "biotecnolog",
      "sensor",
      "inteligencia artificial",
      "automa",
      "gps",
      "aplicativo",
      "software",
      "inovacao",
      "inovação",
      "inteligencia de maquina",
    ],
    peso: 2,
  },
  {
    id: "POLITICAS",
    palavras: [
      "politica agricola",
      "política agrícola",
      "governo",
      "congresso",
      "ministerio da agricultura",
      "ministério da agricultura",
      "mapa",
      "credito rural",
      "crédito rural",
      "plano safra",
      "regulament",
      "lei agricola",
      "lei agrícola",
      "tribut",
      "reforma tribut",
    ],
    peso: 2,
  },
  {
    id: "SUSTENTABILIDADE",
    palavras: [
      "sustentab",
      "carbono",
      "esg",
      "biodivers",
      "desmat",
      "emissao",
      "emissão",
      "organico",
      "orgânico",
      "agroecolog",
      "reciclag",
      "mudancas climaticas",
      "mudanças climáticas",
    ],
    peso: 2,
  },
];

const ALIAS_CATEGORIA_RSS = [
  { id: "CLIMA", termos: ["clima", "tempo", "meteorolog", "chuva", "previsao", "previsão", "elnino", "lanina"] },
  { id: "MERCADO", termos: ["mercado", "econom", "negocio", "cotacao", "commodit"] },
  { id: "MANEJO", termos: ["manejo", "producao", "lavoura", "plantio", "colheita", "fitossanit"] },
  { id: "TECNOLOGIA", termos: ["tecnologia", "inovacao", "digital", "maquina"] },
  { id: "POLITICAS", termos: ["politica", "governo", "legisl", "regulament", "ministerio"] },
  { id: "SUSTENTABILIDADE", termos: ["sustentab", "ambient", "esg", "carbono"] },
];

function scorePorPalavras(texto, palavras, pesoBase = 2) {
  let score = 0;
  for (const palavra of palavras) {
    if (texto.includes(normalizarTextoClima(palavra))) {
      score += pesoBase;
    }
  }
  return score;
}

function categorizarPorTagsRss(categoriasRss) {
  const texto = normalizarTextoClima((categoriasRss ?? []).join(" "));
  if (!texto) return { categoria: null, scoreClima: 0 };

  const scoreClimaRss = calcularScoreClima(texto);
  if (scoreClimaRss >= MIN_SCORE_CLIMA_CATEGORIA) {
    return { categoria: "CLIMA", scoreClima: scoreClimaRss };
  }

  for (const alias of ALIAS_CATEGORIA_RSS) {
    if (alias.termos.some((t) => texto.includes(normalizarTextoClima(t)))) {
      return {
        categoria: alias.id,
        scoreClima: alias.id === "CLIMA" ? scoreClimaRss : calcularScoreClima(texto),
      };
    }
  }
  return { categoria: null, scoreClima: scoreClimaRss };
}

export function categorizarNoticia({ titulo = "", descricao = "", categoriasRss = [] }) {
  const textoCompleto = { titulo, descricao, categoriasRss };
  const scoreClima = calcularScoreClima(textoCompleto);
  const texto = normalizarTextoClima(`${titulo} ${descricao} ${(categoriasRss ?? []).join(" ")}`);

  const porRss = categorizarPorTagsRss(categoriasRss);
  if (porRss.categoria === "CLIMA" || scoreClima >= MIN_SCORE_CLIMA_CATEGORIA) {
    return { categoria: "CLIMA", scoreClima };
  }

  const scores = { CLIMA: scoreClima };
  for (const regra of REGRAS_CATEGORIA) {
    scores[regra.id] = scorePorPalavras(texto, regra.palavras, regra.peso);
  }

  if (porRss.categoria && porRss.categoria !== "CLIMA") {
    scores[porRss.categoria] = (scores[porRss.categoria] ?? 0) + 3;
  }

  let melhor = "MERCADO";
  let maiorScore = scores.MERCADO ?? 0;

  for (const [id, valor] of Object.entries(scores)) {
    if (id === "CLIMA") continue;
    if (valor > maiorScore) {
      maiorScore = valor;
      melhor = id;
    }
  }

  if (scoreClima >= 3 && scoreClima >= maiorScore - 1) {
    return { categoria: "CLIMA", scoreClima };
  }

  if (maiorScore === 0) {
    return { categoria: "MERCADO", scoreClima };
  }

  return { categoria: melhor, scoreClima };
}
