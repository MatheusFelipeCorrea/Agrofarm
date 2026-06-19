import axios from "axios";
import { prisma } from "../database/client.js";
import { cotacaoView } from "../views/cotacao.view.js";

const AWESOME_API_BASE_URL = "https://economia.awesomeapi.com.br/json/last";
const YAHOO_CHART_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const STOOQ_BASE_URL = "https://stooq.com/q/l/";
const COMMODITY_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const COMMODITY_CATALOG = [
	{ id: "soja", nome: "Soja", symbol: "ZS=F", stooqSymbol: "zs.f", unidade: "USX/bushel", aliases: ["soja"] },
	{ id: "milho", nome: "Milho", symbol: "ZC=F", stooqSymbol: "zc.f", unidade: "USX/bushel", aliases: ["milho"] },
	{ id: "cafe", nome: "Café", symbol: "KC=F", stooqSymbol: "kc.f", unidade: "USX/lb", aliases: ["cafe", "café"] },
	{ id: "trigo", nome: "Trigo", symbol: "ZW=F", stooqSymbol: "zw.f", unidade: "USX/bushel", aliases: ["trigo", "wheat"] },
	{ id: "algodao", nome: "Algodão", symbol: "CT=F", stooqSymbol: "ct.f", unidade: "USX/lb", aliases: ["algodao", "algodão", "cotton"] },
];

const DEFAULT_COMMODITIES = ["soja", "milho", "cafe"];
const CULTURAS_IGNORADAS = new Set(["sorgo"]);
const commodityFallbackCache = new Map();

function normalizarTexto(valor) {
	return String(valor ?? "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();
}

function slugify(valor) {
	return normalizarTexto(valor)
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function encontrarCommodityPorCultura(nomeCultura) {
	const nomeNormalizado = normalizarTexto(nomeCultura);
	return COMMODITY_CATALOG.find((item) => item.aliases.some((alias) => nomeNormalizado.includes(normalizarTexto(alias))));
}

function commoditySemCotacao(nomeCultura) {
	const idNormalizado = slugify(nomeCultura) || "cultura-sem-mapeamento";
	return {
		id: `cultura-${idNormalizado}`,
		nome: nomeCultura,
		symbol: null,
		unidade: null,
		valor: null,
		variacao: null,
		moeda: null,
		fonte: "sem-cotacao-mapeada",
		atualizadoEm: null,
	};
}

async function obterCulturasCadastradas() {
	const culturas = await prisma.culturas.findMany({
		select: { nome: true },
		orderBy: { nome: "asc" },
	});

	return culturas
		.map((item) => item.nome)
		.filter((nome) => {
			if (!nome) return false;
			return !CULTURAS_IGNORADAS.has(normalizarTexto(nome));
		});
}

function obterCommoditiesPadrao() {
	return COMMODITY_CATALOG.filter((item) => DEFAULT_COMMODITIES.includes(item.id));
}

async function montarCommoditiesAlvo() {
	const culturas = await obterCulturasCadastradas();

	if (culturas.length === 0) {
		return obterCommoditiesPadrao();
	}

	const encontrados = [];
	const semMapeamento = [];
	const idsIncluidos = new Set();

	for (const nomeCultura of culturas) {
		const commodity = encontrarCommodityPorCultura(nomeCultura);

		if (commodity) {
			if (!idsIncluidos.has(commodity.id)) {
				idsIncluidos.add(commodity.id);
				encontrados.push(commodity);
			}
			continue;
		}

		semMapeamento.push(commoditySemCotacao(nomeCultura));
	}

	return [...encontrados, ...semMapeamento];
}

function toIsoStringFromAwesome(payload) {
	if (payload?.create_date) {
		const isoCandidate = String(payload.create_date).replace(" ", "T");
		const date = new Date(isoCandidate);
		if (!Number.isNaN(date.getTime())) return date.toISOString();
	}

	if (payload?.timestamp) {
		const ts = Number(payload.timestamp);
		if (Number.isFinite(ts)) return new Date(ts * 1000).toISOString();
	}

	return new Date().toISOString();
}

function fonteComMoeda(fonte, moeda) {
	if (!fonte) return moeda;
	return `${fonte}:${moeda}`;
}

async function salvarCotacaoNoBanco({ moeda, cotacao }) {
	if (!cotacao?.valor) return;

	try {
		await prisma.cotacoes.create({
			data: {
				valor: cotacao.valor,
				fonte: fonteComMoeda(cotacao.fonte, moeda),
				atualizado_em: cotacao.atualizado_em ? new Date(cotacao.atualizado_em) : new Date(),
			},
		});
	} catch {
		// Persistência de fallback não deve quebrar resposta da cotação.
	}
}

async function buscarCotacaoBancoPorMoeda(moeda) {
	const especifica = await prisma.cotacoes.findFirst({
		where: {
			fonte: {
				contains: `:${moeda}`,
			},
		},
		orderBy: { atualizado_em: "desc" },
	});

	if (especifica) {
		return especifica;
	}

	// Último recurso: apenas registros legados SEM tag de moeda (fonte sem ":").
	// Nunca devolver uma cotação de outra moeda (ex.: EUR rotulada como USD).
	return prisma.cotacoes.findFirst({
		where: { NOT: { fonte: { contains: ":" } } },
		orderBy: { atualizado_em: "desc" },
	});
}

async function fetchMoedaAwesome(pair) {
	const { data } = await axios.get(`${AWESOME_API_BASE_URL}/${pair}`, { timeout: 8_000 });
	const key = pair.replace("-", "").toUpperCase();
	const payload = data?.[key];

	if (!payload || payload.bid == null) {
		throw new Error(`Cotação indisponível para ${pair}`);
	}

	return {
		valor: Number(payload.bid),
		variacao: payload.pctChange == null ? null : Number(payload.pctChange),
		fonte: "awesomeapi",
		atualizado_em: toIsoStringFromAwesome(payload),
	};
}

// Os contratos futuros do catálogo (CBOT/ICE) são cotados em CENTAVOS de dólar
// (¢/bushel ou ¢/lb). Convertendo para USD a leitura deixa de ficar 100x inflada.
function converterCentavosParaUsd(valorEmCentavos, unidade) {
	if (valorEmCentavos == null || !Number.isFinite(Number(valorEmCentavos))) {
		return { valor: null, unidade: unidade?.replace("USX", "USD") ?? unidade };
	}

	return {
		valor: Number(valorEmCentavos) / 100,
		unidade: unidade?.replace("USX", "USD") ?? unidade,
	};
}

async function fetchCommodityYahoo(item) {
	const encoded = encodeURIComponent(item.symbol);
	const { data } = await axios.get(`${YAHOO_CHART_BASE_URL}/${encoded}`, {
		params: { interval: "1d", range: "5d" },
		timeout: 8_000,
	});

	const result = data?.chart?.result?.[0];
	const closes = result?.indicators?.quote?.[0]?.close;
	const series = Array.isArray(closes) ? closes.filter((value) => Number.isFinite(value)) : [];
	const last = series.length > 0 ? Number(series.at(-1)) : null;
	const previous = series.length > 1 ? Number(series.at(-2)) : null;
	const variacao = previous && last != null ? ((last - previous) / previous) * 100 : null;
	const regularMarketTime = Number(result?.meta?.regularMarketTime);
	const convertido = converterCentavosParaUsd(last, item.unidade);

	return {
		id: item.id,
		nome: item.nome,
		symbol: item.symbol,
		unidade: convertido.unidade,
		valor: convertido.valor,
		variacao,
		moeda: "USD",
		fonte: "yahoo-finance",
		atualizadoEm: Number.isFinite(regularMarketTime)
			? new Date(regularMarketTime * 1000).toISOString()
			: new Date().toISOString(),
	};
}

async function fetchCommodityStooq(item) {
	const stooqSymbol = item.stooqSymbol ?? `${String(item.symbol ?? "").replace("=F", "").toLowerCase()}.f`;
	const { data } = await axios.get(STOOQ_BASE_URL, {
		params: { s: stooqSymbol, f: "sd2t2ohlcv", h: "", e: "csv" },
		timeout: 8_000,
	});

	const linhas = String(data ?? "").trim().split(/\r?\n/);
	if (linhas.length < 2) {
		throw new Error(`Cotação indisponível no fallback Stooq para ${item.id}`);
	}

	const valores = linhas[1].split(",").map((valor) => valor.trim());
	const [symbol, date, time, , , , closeValue] = valores;
	const close = Number(closeValue);

	if (!symbol || !Number.isFinite(close)) {
		throw new Error(`Resposta inválida no fallback Stooq para ${item.id}`);
	}

	const timestamp = date && time ? new Date(`${date}T${time}Z`) : new Date();
	const convertido = converterCentavosParaUsd(close, item.unidade);

	return {
		id: item.id,
		nome: item.nome,
		symbol: item.symbol,
		unidade: convertido.unidade,
		valor: convertido.valor,
		// O Stooq só expõe OHLC do dia; uma variação intradiária (close-open) teria
		// significado diferente da diária do Yahoo. Mantemos null para não misturar.
		variacao: null,
		moeda: "USD",
		fonte: "stooq-fallback",
		atualizadoEm: Number.isNaN(timestamp.getTime()) ? new Date().toISOString() : timestamp.toISOString(),
	};
}

function atualizarCacheCommodity(commodity) {
	if (!commodity?.id || commodity?.valor == null) return;

	commodityFallbackCache.set(commodity.id, {
		data: { ...commodity },
		cachedAt: Date.now(),
	});
}

function obterCommodityDoCache(item) {
	const entrada = commodityFallbackCache.get(item.id);
	if (!entrada) return null;

	if (Date.now() - entrada.cachedAt > COMMODITY_CACHE_TTL_MS) {
		commodityFallbackCache.delete(item.id);
		return null;
	}

	return {
		...entrada.data,
		fonte: "cache-local-fallback",
	};
}

export const cotacaoService = {
	buscarDolar: async () => {
		try {
			const cotacao = await fetchMoedaAwesome("USD-BRL");
			await salvarCotacaoNoBanco({ moeda: "USD", cotacao });
			return cotacaoView.renderDolar(cotacao);
		} catch {
			const cotacao = await buscarCotacaoBancoPorMoeda("USD");

			return cotacaoView.renderDolar(cotacao);
		}
	},

	buscarEuro: async () => {
		try {
			const cotacao = await fetchMoedaAwesome("EUR-BRL");
			await salvarCotacaoNoBanco({ moeda: "EUR", cotacao });
			return cotacaoView.renderMoeda(cotacao);
		} catch {
			const cotacao = await buscarCotacaoBancoPorMoeda("EUR");
			return cotacaoView.renderMoeda(cotacao);
		}
	},

	buscarCommodities: async () => {
		const commoditiesAlvo = await montarCommoditiesAlvo();
		const commodities = await Promise.all(
			commoditiesAlvo.map(async (item) => {
				if (!item.symbol) {
					return item;
				}

				try {
					const yahoo = await fetchCommodityYahoo(item);
					atualizarCacheCommodity(yahoo);
					return yahoo;
				} catch {
					try {
						const stooq = await fetchCommodityStooq(item);
						atualizarCacheCommodity(stooq);
						return stooq;
					} catch {
						const cached = obterCommodityDoCache(item);
						if (cached) return cached;

						return {
							id: item.id,
							nome: item.nome,
							symbol: item.symbol,
							unidade: item.unidade?.replace("USX", "USD") ?? item.unidade,
							valor: null,
							variacao: null,
							moeda: null,
							fonte: "falha-provedor-externo",
							atualizadoEm: null,
						};
					}
				}
			}),
		);

		return commodities;
	},

	buscarPainelMercado: async () => {
		const [dolar, euro, commodities] = await Promise.all([
			cotacaoService.buscarDolar(),
			cotacaoService.buscarEuro().catch(() => cotacaoView.renderMoeda(null)),
			cotacaoService.buscarCommodities(),
		]);

		return cotacaoView.renderMercado({ dolar, euro, commodities });
	},
};
