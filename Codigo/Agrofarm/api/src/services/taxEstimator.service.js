import { ibptService } from "./ibpt.service.js";

const TAXA_CORRETAGEM_PADRAO = 0.02;
const TAXA_CUSTOS_LOGISTICOS_PADRAO = 0.01;

const AJUSTE_POR_CULTURA = {
	cafe: { corretagem: 0.025, logisticos: 0.012 },
	soja: { corretagem: 0.018, logisticos: 0.01 },
	milho: { corretagem: 0.018, logisticos: 0.011 },
};

function toNumber(value) {
	return Number(value ?? 0);
}

function normalizarCultura(nome) {
	return String(nome ?? "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();
}

function resolverCorretagemLogistica(cultura, quantidadeSacas) {
	const chave = normalizarCultura(cultura);
	const ajuste = AJUSTE_POR_CULTURA[chave] ?? {};

	let logisticos = ajuste.logisticos ?? TAXA_CUSTOS_LOGISTICOS_PADRAO;
	const sacas = Math.max(toNumber(quantidadeSacas), 0);

	if (sacas >= 100) {
		logisticos = Math.max(logisticos * 0.85, 0.005);
	} else if (sacas >= 50) {
		logisticos = Math.max(logisticos * 0.92, 0.007);
	}

	return {
		corretagem: ajuste.corretagem ?? TAXA_CORRETAGEM_PADRAO,
		logisticos,
	};
}

function resolverLogisticaMercadoInterno(cultura, quantidadeSacas) {
	const sacas = Math.max(toNumber(quantidadeSacas), 0);
	let logisticos = 0.005;

	if (sacas >= 100) {
		logisticos = 0.004;
	} else if (sacas >= 50) {
		logisticos = 0.0045;
	}

	return logisticos;
}

function estimarMercadoInternoPuro({ valorBruto, quantidadeSacas, cultura }) {
	const valor = Math.max(toNumber(valorBruto), 0);
	const impostosFederais = 0.045;
	const icmsEstimado = 0.12;
	const logisticos = resolverLogisticaMercadoInterno(cultura, quantidadeSacas);

	const valorImpostosFederais = valor * impostosFederais;
	const valorIcms = valor * icmsEstimado;
	const valorLogisticos = valor * logisticos;

	return {
		percentual: impostosFederais + icmsEstimado + logisticos,
		itens: [
			{ nome: "Impostos federais (estimativa)", percentual: impostosFederais, valor: valorImpostosFederais },
			{ nome: "ICMS estadual (estimativa)", percentual: icmsEstimado, valor: valorIcms },
			{ nome: "Frete e armazenagem", percentual: logisticos, valor: valorLogisticos },
		],
		valorTotal: valorImpostosFederais + valorIcms + valorLogisticos,
		fonte: "estimativa-mercado-interno",
		ncm: null,
		uf: null,
	};
}

function montarMercadoInternoComIbpt({ ibpt, valorBruto, quantidadeSacas, cultura }) {
	const valor = Math.max(toNumber(valorBruto), 0);
	const logisticos = resolverLogisticaMercadoInterno(cultura, quantidadeSacas);

	const pctFederal = ibpt.valores
		? ibpt.valores.nacional / Math.max(valor, 0.01)
		: ibpt.aliquotaNacionalFederal;
	const pctEstadual = ibpt.valores
		? ibpt.valores.estadual / Math.max(valor, 0.01)
		: ibpt.aliquotaEstadual;
	const pctMunicipal = ibpt.valores
		? (ibpt.valores.municipal ?? 0) / Math.max(valor, 0.01)
		: ibpt.aliquotaMunicipal;

	const valorFederal = valor * pctFederal;
	const valorEstadual = valor * pctEstadual;
	const valorMunicipal = valor * pctMunicipal;
	const valorLogisticos = valor * logisticos;

	const itens = [
		{
			nome: "Tributos federais (IBPT)",
			percentual: pctFederal,
			valor: valorFederal,
		},
		{
			nome: "ICMS estadual (IBPT)",
			percentual: pctEstadual,
			valor: valorEstadual,
		},
	];

	if (pctMunicipal > 0) {
		itens.push({
			nome: "Tributos municipais (IBPT)",
			percentual: pctMunicipal,
			valor: valorMunicipal,
		});
	}

	itens.push({
		nome: "Frete e armazenagem",
		percentual: logisticos,
		valor: valorLogisticos,
	});

	const valorTotal = itens.reduce((acc, item) => acc + toNumber(item.valor), 0);

	return {
		percentual: valor > 0 ? valorTotal / valor : 0,
		itens,
		valorTotal,
		fonte: ibpt.fonte === "ibpt-oficial" ? "ibpt-mercado-interno" : "ibpt-valraw-mercado-interno",
		ncm: ibpt.ncm,
		uf: ibpt.uf,
		ibpt: {
			descricao: ibpt.descricao,
			tabela: ibpt.tabela ?? ibpt.versao ?? null,
			vigenciaInicio: ibpt.vigenciaInicio ?? null,
			vigenciaFim: ibpt.vigenciaFim ?? null,
		},
	};
}

function estimarInternoPuro({ cultura, valorBruto, quantidadeSacas }) {
	const valor = Math.max(toNumber(valorBruto), 0);
	const impostosPadrao = 0.03;
	const { corretagem, logisticos } = resolverCorretagemLogistica(cultura, quantidadeSacas);

	const valorCorretagem = valor * corretagem;
	const valorImpostos = valor * impostosPadrao;
	const valorLogisticos = valor * logisticos;

	return {
		percentual: corretagem + impostosPadrao + logisticos,
		itens: [
			{ nome: "Impostos (estimativa)", percentual: impostosPadrao, valor: valorImpostos },
			{ nome: "Corretagem", percentual: corretagem, valor: valorCorretagem },
			{ nome: "Custos logisticos", percentual: logisticos, valor: valorLogisticos },
		],
		valorTotal: valorCorretagem + valorImpostos + valorLogisticos,
		fonte: "estimativa-interna",
		ncm: null,
		uf: null,
	};
}

function montarComIbpt({ ibpt, cultura, valorBruto, quantidadeSacas }) {
	const valor = Math.max(toNumber(valorBruto), 0);
	const { corretagem, logisticos } = resolverCorretagemLogistica(cultura, quantidadeSacas);

	const pctFederal = ibpt.valores
		? ibpt.valores.nacional / Math.max(valor, 0.01)
		: ibpt.aliquotaNacionalFederal;
	const pctEstadual = ibpt.valores
		? ibpt.valores.estadual / Math.max(valor, 0.01)
		: ibpt.aliquotaEstadual;
	const pctMunicipal = ibpt.valores
		? (ibpt.valores.municipal ?? 0) / Math.max(valor, 0.01)
		: ibpt.aliquotaMunicipal;

	const valorFederal = valor * pctFederal;
	const valorEstadual = valor * pctEstadual;
	const valorMunicipal = valor * pctMunicipal;
	const valorCorretagem = valor * corretagem;
	const valorLogisticos = valor * logisticos;

	const itens = [
		{
			nome: "Tributos federais (IBPT)",
			percentual: pctFederal,
			valor: valorFederal,
		},
		{
			nome: "ICMS estadual (IBPT)",
			percentual: pctEstadual,
			valor: valorEstadual,
		},
	];

	if (pctMunicipal > 0) {
		itens.push({
			nome: "Tributos municipais (IBPT)",
			percentual: pctMunicipal,
			valor: valorMunicipal,
		});
	}

	itens.push(
		{ nome: "Corretagem", percentual: corretagem, valor: valorCorretagem },
		{ nome: "Custos logisticos", percentual: logisticos, valor: valorLogisticos },
	);

	const valorTotal = itens.reduce((acc, item) => acc + toNumber(item.valor), 0);

	return {
		percentual: valor > 0 ? valorTotal / valor : 0,
		itens,
		valorTotal,
		fonte: ibpt.fonte === "ibpt-oficial" ? "ibpt-oficial" : "ibpt-valraw",
		ncm: ibpt.ncm,
		uf: ibpt.uf,
		ibpt: {
			descricao: ibpt.descricao,
			tabela: ibpt.tabela ?? ibpt.versao ?? null,
			vigenciaInicio: ibpt.vigenciaInicio ?? null,
			vigenciaFim: ibpt.vigenciaFim ?? null,
		},
	};
}

async function estimarTaxasExportacao({ cultura, valorBruto, quantidadeSacas }) {
	const valor = Math.max(toNumber(valorBruto), 0);

	try {
		const ibpt = await ibptService.consultarTributosPorCultura({ cultura, valorBruto: valor });
		if (ibpt) {
			return montarComIbpt({ ibpt, cultura, valorBruto: valor, quantidadeSacas });
		}
	} catch {
		// fallback interno
	}

	return estimarInternoPuro({ cultura, valorBruto: valor, quantidadeSacas });
}

async function estimarTaxasMercadoInterno({ cultura, valorBruto, quantidadeSacas }) {
	const valor = Math.max(toNumber(valorBruto), 0);

	try {
		const ibpt = await ibptService.consultarTributosPorCultura({ cultura, valorBruto: valor });
		if (ibpt) {
			return montarMercadoInternoComIbpt({ ibpt, valorBruto: valor, quantidadeSacas, cultura });
		}
	} catch {
		// fallback interno
	}

	return estimarMercadoInternoPuro({ cultura, valorBruto: valor, quantidadeSacas });
}

export const taxEstimatorService = {
	async estimarTaxas({ cultura, valorBruto, quantidadeSacas, exportacao = true }) {
		const valor = Math.max(toNumber(valorBruto), 0);

		if (valor <= 0) {
			return {
				percentual: 0,
				itens: [],
				valorTotal: 0,
				fonte: exportacao ? "estimativa-interna" : "estimativa-mercado-interno",
				ncm: null,
				uf: null,
			};
		}

		if (!exportacao) {
			return estimarTaxasMercadoInterno({ cultura, valorBruto: valor, quantidadeSacas });
		}

		return estimarTaxasExportacao({ cultura, valorBruto: valor, quantidadeSacas });
	},
};
