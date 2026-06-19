import axios from "axios";
import { gunzipSync } from "node:zlib";
import { resolverNcmCultura } from "../config/culturaNcm.config.js";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cacheValraw = new Map();

function toNumber(value) {
	return Number(value ?? 0);
}

function isEnabled() {
	const flag = String(process.env.IBPT_ENABLED ?? "true").toLowerCase();
	return flag !== "false" && flag !== "0";
}

function getUf() {
	return String(process.env.IBPT_UF ?? "MG").toUpperCase().slice(0, 2);
}

function getValrawBase() {
	return String(process.env.IBPT_VALRAW_BASE_URL ?? "https://ibpt.valraw.com.br").replace(/\/$/, "");
}

function getOficialBase() {
	return String(process.env.IBPT_API_URL ?? "https://apidoni.ibpt.org.br/api/v1/produtos").replace(/\/$/, "");
}

function normalizarNcm(codigo) {
	return String(codigo ?? "").replace(/\D/g, "").padStart(8, "0").slice(0, 8);
}

function percentualDeValor(valorTributo, valorBase) {
	if (valorBase <= 0) return 0;
	return valorTributo / valorBase;
}

async function obterTabelaValrawMaisRecente() {
	const configurada = process.env.IBPT_VALRAW_TABELA?.trim();
	if (configurada) {
		const [ano, tabela] = configurada.split("/");
		if (ano && tabela) return { ano, tabela };
	}

	const cacheKey = "meta";
	const cached = cacheValraw.get(cacheKey);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.value;
	}

	const { data: meta } = await axios.get(`${getValrawBase()}/api/meta.json`, { timeout: 12_000 });
	const anos = Array.isArray(meta?.anos) ? meta.anos.map(String).sort() : [];
	const ano = anos[anos.length - 1] ?? String(new Date().getFullYear());

	const { data: indexAno } = await axios.get(`${getValrawBase()}/api/${ano}/index.json`, { timeout: 12_000 });
	const tabelas = Array.isArray(indexAno?.tabelas) ? indexAno.tabelas : indexAno?.versoes ?? [];
	const tabelaLista = Array.isArray(tabelas)
		? tabelas.map((t) => (typeof t === "string" ? t : t?.id ?? t?.codigo)).filter(Boolean)
		: [];
	const tabela = tabelaLista[tabelaLista.length - 1] ?? "26.1.H";

	const resultado = { ano, tabela };
	cacheValraw.set(cacheKey, { value: resultado, expiresAt: Date.now() + CACHE_TTL_MS });
	return resultado;
}

async function buscarRegistroValraw({ ncm, uf }) {
	const ncmNorm = normalizarNcm(ncm);
	const cacheKey = `valraw:${uf}:${ncmNorm}`;
	const cached = cacheValraw.get(cacheKey);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.value;
	}

	const { ano, tabela } = await obterTabelaValrawMaisRecente();
	const url = `${getValrawBase()}/api/${ano}/${tabela}/ncm/${uf}.json.gz`;

	const { data } = await axios.get(url, {
		responseType: "arraybuffer",
		timeout: 30_000,
	});

	const json = JSON.parse(gunzipSync(Buffer.from(data)).toString("utf8"));
	const lista = Array.isArray(json?.dados) ? json.dados : [];
	const registro =
		lista.find((item) => normalizarNcm(item.codigo) === ncmNorm) ??
		lista.find((item) => normalizarNcm(item.codigo).startsWith(ncmNorm.slice(0, 6)));

	if (!registro) return null;

	const resultado = {
		ncm: ncmNorm,
		descricao: registro.descricao ?? "",
		aliquotaNacionalFederal: toNumber(registro.aliquotaNacionalFederal) / 100,
		aliquotaImportadosFederal: toNumber(registro.aliquotaImportadosFederal) / 100,
		aliquotaEstadual: toNumber(registro.aliquotaEstadual) / 100,
		aliquotaMunicipal: toNumber(registro.aliquotaMunicipal) / 100,
		vigenciaInicio: registro.vigenciaInicio ?? null,
		vigenciaFim: registro.vigenciaFim ?? null,
		tabela: json.tabela ?? tabela,
		uf,
		fonte: "ibpt-valraw",
	};

	cacheValraw.set(cacheKey, { value: resultado, expiresAt: Date.now() + CACHE_TTL_MS });
	return resultado;
}

async function consultarIbptOficial({ ncm, uf, valor, descricao }) {
	const token = process.env.IBPT_TOKEN?.trim();
	const cnpj = String(process.env.IBPT_CNPJ ?? "").replace(/\D/g, "");

	if (!token || !cnpj) return null;

	const params = new URLSearchParams({
		token,
		cnpj,
		codigo: normalizarNcm(ncm),
		uf,
		ex: "0",
		descricao: descricao || "Produto agricola",
		unidadeMedida: process.env.IBPT_UNIDADE_MEDIDA ?? "SC",
		valor: String(Math.max(toNumber(valor), 0.01)),
		gtin: process.env.IBPT_GTIN ?? "SEM GTIN",
	});

	const { data } = await axios.get(`${getOficialBase()}?${params.toString()}`, { timeout: 10_000 });

	const valorNacional = toNumber(data?.ValorTributoNacional);
	const valorEstadual = toNumber(data?.ValorTributoEstadual);
	const valorMunicipal = toNumber(data?.ValorTributoMunicipal);
	const valorBase = Math.max(toNumber(valor), 0.01);

	return {
		ncm: normalizarNcm(ncm),
		descricao: data?.Descricao ?? descricao,
		aliquotaNacionalFederal: percentualDeValor(valorNacional, valorBase),
		aliquotaImportadosFederal: percentualDeValor(toNumber(data?.ValorTributoImportado), valorBase),
		aliquotaEstadual: percentualDeValor(valorEstadual, valorBase),
		aliquotaMunicipal: percentualDeValor(valorMunicipal, valorBase),
		valores: {
			nacional: valorNacional,
			estadual: valorEstadual,
			municipal: valorMunicipal,
		},
		versao: data?.Versao ?? null,
		fonte: "ibpt-oficial",
		uf,
	};
}

export const ibptService = {
	isEnabled,

	async consultarTributosPorCultura({ cultura, valorBruto }) {
		if (!isEnabled()) return null;

		const ncmInfo = resolverNcmCultura(cultura);
		if (!ncmInfo?.ncm) return null;

		const uf = getUf();
		const valor = Math.max(toNumber(valorBruto), 0);

		try {
			const oficial = await consultarIbptOficial({
				ncm: ncmInfo.ncm,
				uf,
				valor,
				descricao: ncmInfo.descricao,
			});
			if (oficial) return oficial;
		} catch {
			// fallback valraw
		}

		try {
			return await buscarRegistroValraw({ ncm: ncmInfo.ncm, uf });
		} catch {
			return null;
		}
	},

	resolverNcmCultura,
};
