/** Fontes RSS de agronegócio (consumidas no servidor; links abrem no site de origem). */
export const NOTICIA_FONTES = [
  {
    id: "canal-rural",
    nome: "Canal Rural",
    url: "https://www.canalrural.com.br/feed/",
    siteUrl: "https://www.canalrural.com.br/",
    prioridade: 10,
  },
  {
    id: "canal-rural-clima",
    nome: "Canal Rural — Clima",
    url: "https://www.canalrural.com.br/tag/previsao-do-tempo/feed/",
    siteUrl: "https://www.canalrural.com.br/tag/previsao-do-tempo/",
    prioridade: 11,
  },
  {
    id: "agrolink",
    nome: "Agrolink",
    url: "https://www.agrolink.com.br/rss/",
    siteUrl: "https://www.agrolink.com.br/",
    prioridade: 8,
  },
  {
    id: "noticias-agricolas",
    nome: "Notícias Agrícolas",
    url: "https://www.noticiasagricolas.com.br/rss/",
    siteUrl: "https://www.noticiasagricolas.com.br/",
    prioridade: 7,
  },
  {
    id: "revista-cultivar",
    nome: "Revista Cultivar",
    url: "https://revistacultivar.com/feed/",
    siteUrl: "https://revistacultivar.com/",
    prioridade: 6,
  },
  {
    id: "embrapa",
    nome: "Embrapa",
    url: "https://www.embrapa.br/rss",
    siteUrl: "https://www.embrapa.br/",
    prioridade: 5,
  },
];

export const NOTICIA_CATEGORIAS = [
  { id: "TODAS", label: "Todas" },
  { id: "CLIMA", label: "Clima" },
  { id: "MERCADO", label: "Mercado" },
  { id: "MANEJO", label: "Manejo" },
  { id: "TECNOLOGIA", label: "Tecnologia" },
  { id: "POLITICAS", label: "Políticas" },
  { id: "SUSTENTABILIDADE", label: "Sustentabilidade" },
];
