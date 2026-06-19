import Parser from "rss-parser";
import { AppError } from "../shared/errors/AppError.js";
import { categorizarNoticia } from "./noticia/noticia.categorizar.js";
import { pertenceAoClima } from "./noticia/noticia.clima.js";
import { NOTICIA_CATEGORIAS, NOTICIA_FONTES } from "./noticia/noticia.sources.js";

const parser = new Parser({
  timeout: 12000,
  headers: {
    "User-Agent": "AgroFarm/1.0 (+https://agrofarm.app; noticias agronegocio)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
    ],
  },
});

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache = { expiresAt: 0, items: [] };

function stripHtml(html) {
  return String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function estimarMinutosLeitura(texto) {
  const palavras = stripHtml(texto).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.min(15, Math.round(palavras / 180)));
}

function extrairImagem(item) {
  const enclosure = item.enclosure?.url;
  if (enclosure && /\.(jpe?g|png|webp|gif)/i.test(enclosure)) return enclosure;

  const media = item.mediaContent?.[0]?.$?.url ?? item.mediaThumbnail?.[0]?.$?.url;
  if (media) return media;

  const html = item.content ?? item["content:encoded"] ?? item.summary ?? "";
  const match = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

function parseDataPub(item) {
  const raw = item.isoDate ?? item.pubDate;
  const date = raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date;
}

function criarIdEstavel(link, titulo, fonteId) {
  const base = `${fonteId}:${link || titulo}`;
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash << 5) - hash + base.charCodeAt(i);
    hash |= 0;
  }
  return `news-${Math.abs(hash)}`;
}

async function buscarFeed(fonte) {
  try {
    const feed = await parser.parseURL(fonte.url);
    return (feed.items ?? []).map((item) => {
      const titulo = stripHtml(item.title ?? "Sem título");
      const descricao = stripHtml(item.contentSnippet ?? item.summary ?? item.content ?? "");
      const link = item.link ?? item.guid ?? fonte.siteUrl;
      const dataPublicacao = parseDataPub(item);
      const categoriasRss = Array.isArray(item.categories) ? item.categories : [];
      const { categoria, scoreClima } = categorizarNoticia({ titulo, descricao, categoriasRss });

      return {
        id: criarIdEstavel(link, titulo, fonte.id),
        titulo,
        descricao: descricao.slice(0, 420),
        link,
        imagemUrl: extrairImagem(item),
        dataPublicacao,
        categoria,
        scoreClima,
        fonte: {
          id: fonte.id,
          nome: fonte.nome,
          siteUrl: fonte.siteUrl,
        },
        prioridadeFonte: fonte.prioridade,
        minutosLeitura: estimarMinutosLeitura(`${titulo} ${descricao}`),
      };
    });
  } catch {
    return [];
  }
}

async function carregarTodasNoticias() {
  const agora = Date.now();
  if (cache.items.length && cache.expiresAt > agora) {
    return cache.items;
  }

  const resultados = await Promise.all(NOTICIA_FONTES.map((fonte) => buscarFeed(fonte)));
  const porLink = new Map();

  for (const lista of resultados) {
    for (const item of lista) {
      if (!item.link) continue;
      const existente = porLink.get(item.link);
      if (!existente || (item.prioridadeFonte ?? 0) > (existente.prioridadeFonte ?? 0)) {
        porLink.set(item.link, item);
      }
    }
  }

  const items = [...porLink.values()]
    .filter((n) => n.dataPublicacao)
    .sort((a, b) => b.dataPublicacao - a.dataPublicacao);

  cache = { items, expiresAt: agora + CACHE_TTL_MS };
  return items;
}

function filtrarPorBusca(items, busca) {
  const termo = String(busca ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (!termo) return items;

  return items.filter((item) => {
    const texto = `${item.titulo} ${item.descricao} ${item.fonte?.nome ?? ""}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    return texto.includes(termo);
  });
}

function contarPorCategoria(items) {
  const counts = Object.fromEntries(
    NOTICIA_CATEGORIAS.filter((c) => c.id !== "TODAS").map((c) => [c.id, 0]),
  );

  for (const item of items) {
    if (pertenceAoClima(item)) {
      counts.CLIMA += 1;
      continue;
    }
    if (counts[item.categoria] != null) counts[item.categoria] += 1;
  }

  return NOTICIA_CATEGORIAS.filter((c) => c.id !== "TODAS").map((c) => ({
    id: c.id,
    label: c.label,
    total: counts[c.id] ?? 0,
  }));
}

function escolherDestaque(items) {
  const canalRural = items.filter((i) => i.fonte?.id === "canal-rural");
  const pool = canalRural.length ? canalRural : items;
  return pool[0] ?? null;
}

function aplicarFiltros(items, { categoria, busca }) {
  let filtrados = filtrarPorBusca(items, busca);

  if (categoria === "CLIMA") {
    filtrados = filtrados.filter((item) => pertenceAoClima(item));
    filtrados.sort((a, b) => (b.scoreClima ?? 0) - (a.scoreClima ?? 0));
  } else if (categoria && categoria !== "TODAS") {
    filtrados = filtrados.filter((i) => i.categoria === categoria && !pertenceAoClima(i));
  }

  return filtrados;
}

async function listar({ categoria, busca, page = 1, pageSize = 12, incluirDestaque = true }) {
  const todos = await carregarTodasNoticias();

  if (!todos.length) {
    throw new AppError(
      "Não foi possível carregar notícias no momento. Tente novamente em alguns minutos.",
      503,
    );
  }

  const pagina = Math.max(1, Number(page) || 1);
  const termoBusca = String(busca ?? "").trim();
  const comFiltroCategoria = Boolean(categoria && categoria !== "TODAS");
  const comBusca = termoBusca.length > 0;

  const filtrados = aplicarFiltros(todos, { categoria, busca: termoBusca });

  const podeDestaque =
    incluirDestaque && pagina === 1 && !comFiltroCategoria && !comBusca;
  const destaque = podeDestaque ? escolherDestaque(filtrados) : null;
  const listaSemDestaque = destaque
    ? filtrados.filter((i) => i.id !== destaque.id)
    : filtrados;
  const tamanho = Math.min(30, Math.max(4, Number(pageSize) || 12));
  const inicio = (pagina - 1) * tamanho;
  const fatia = listaSemDestaque.slice(inicio, inicio + tamanho);

  return {
    destaque,
    items: fatia,
    meta: {
      page: pagina,
      pageSize: tamanho,
      totalItems: listaSemDestaque.length,
      totalPages: Math.max(1, Math.ceil(listaSemDestaque.length / tamanho)),
    },
    temas: contarPorCategoria(todos),
    fontes: NOTICIA_FONTES.map((f) => ({ id: f.id, nome: f.nome, siteUrl: f.siteUrl })),
    categorias: NOTICIA_CATEGORIAS,
    atualizadoEm: new Date(cache.expiresAt - CACHE_TTL_MS),
  };
}

export const noticiaService = {
  listar,
  carregarTodasNoticias,
};
