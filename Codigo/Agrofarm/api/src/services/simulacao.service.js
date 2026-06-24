import axios from "axios";
import { AppError } from "../shared/errors/AppError.js";
import { cotacaoService } from "./cotacao.service.js";
import { dashboardRepository } from "../repositories/dashboard.repository.js";
import { gastoRepository } from "../repositories/gasto.repository.js";
import { lucroRepository } from "../repositories/lucro.repository.js";
import { simulacaoRepository } from "../repositories/simulacao.repository.js";
import { taxEstimatorService } from "./taxEstimator.service.js";

function toNumber(value) {
	return Number(value ?? 0);
}

function validarAcessoAdmin(usuario) {
	if (usuario?.role !== "ADMIN") {
		throw new AppError("Apenas ADMIN pode acessar a Simulação", 403);
	}
}

async function buscarResumoGastos(fazendaId, fazendaIdsVisiveis = []) {
	if (fazendaId && fazendaId !== "todas") {
		return gastoRepository.buscarResumoComFiltros({
			filters: { fazendaId },
			role: "ADMIN",
			fazendasPermitidas: [],
		});
	}

	if (fazendaIdsVisiveis.length > 0) {
		return gastoRepository.buscarResumoComFiltros({
			filters: { fazendaIds: fazendaIdsVisiveis },
			role: "ADMIN",
			fazendasPermitidas: [],
		});
	}

	return gastoRepository.buscarResumoComFiltros({
		filters: {},
		role: "ADMIN",
		fazendasPermitidas: [],
	});
}

async function buscarResumoLucro(fazendaId, fazendaIdsVisiveis = []) {
	if (fazendaId && fazendaId !== "todas") {
		const { totalLucro } = await lucroRepository.buscarTotalComFiltros({
			fazendaId,
			role: "ADMIN",
			usuarioId: null,
			fazendaIdsPermitidas: [],
		});
		return { totalLucro: toNumber(totalLucro) };
	}

	const { totalLucro } = await lucroRepository.buscarTotalComFiltros({
		fazendaId: "all",
		role: "ADMIN",
		usuarioId: null,
		fazendaIdsPermitidas: fazendaIdsVisiveis,
	});

	return { totalLucro: toNumber(totalLucro) };
}

function normalizarLinhasPayload(payload) {
	if (Array.isArray(payload.linhas) && payload.linhas.length > 0) {
		return payload.linhas;
	}

	return [
		{
			culturaId: payload.culturaId,
			cultura: payload.cultura,
			quantidadeSacas: payload.quantidadeSacas,
			valorSaca: payload.valorSaca,
			isExportacao: payload.isExportacao,
			moeda: payload.moeda,
			usd: payload.usd,
			brl: payload.brl,
		},
	];
}

function resolverCambioLinha({ linha, moeda, cotacaoAtual, cambioGlobal, payload }) {
	const cambioMoeda = cambioGlobal?.[moeda];
	const usd = cambioMoeda?.usd ?? linha.usd ?? payload.usd;
	const brl = cambioMoeda?.brl ?? linha.brl ?? payload.brl;

	return calcularIndiceCambio({ valorAtual: cotacaoAtual, usd, brl });
}

async function resolverEscopo(usuario, fazendaId) {
	const fazendasVisiveis = await dashboardRepository.listarFazendasVisiveis(usuario);
	const fazendaIdsVisiveis = fazendasVisiveis.map((fazenda) => fazenda.id);

	if (fazendaId === "todas") {
		return {
			escopo: "todas",
			fazendaIds: fazendaIdsVisiveis,
		};
	}

	if (!fazendaIdsVisiveis.includes(fazendaId)) {
		throw new AppError("Fazenda nao encontrada", 404);
	}

	return {
		escopo: "fazenda",
		fazendaIds: [fazendaId],
	};
}

async function buscarCotacaoMoeda(moeda) {
	if (moeda === "EUR") {
		return cotacaoService.buscarEuro();
	}

	return cotacaoService.buscarDolar();
}

function calcularIndiceCambio({ valorAtual, usd, brl }) {
	const cotacaoAtual = toNumber(valorAtual);
	const usdNum = toNumber(usd);
	const brlNum = toNumber(brl);

	if (usdNum > 0 && brlNum > 0) {
		const cotacaoManual = brlNum / usdNum;
		const indiceManual = cotacaoAtual > 0 ? cotacaoManual / cotacaoAtual : 1;

		return {
			valorUsado: cotacaoManual,
			indiceAplicado: indiceManual,
			origem: "manual",
		};
	}

	return {
		valorUsado: cotacaoAtual,
		indiceAplicado: 1,
		origem: "sistema",
	};
}

async function estimarTaxasInternas({ cultura, valorBruto, quantidadeSacas, exportacao = true }) {
	return taxEstimatorService.estimarTaxas({ cultura, valorBruto, quantidadeSacas, exportacao });
}

function resolverIsExportacao(payload) {
	if (typeof payload.isExportacao === "boolean") {
		return payload.isExportacao;
	}

	return payload.moeda !== "BRL";
}

function calcularValorBruto({ isExportacao, quantidadeSacas, valorSaca, cambio, cotacaoAtual }) {
	const base = toNumber(quantidadeSacas) * toNumber(valorSaca);

	if (!isExportacao) {
		return base;
	}

	if (cambio.origem === "manual") {
		return base * toNumber(cambio.valorUsado);
	}

	return base * toNumber(cotacaoAtual);
}

function montarCotacaoResposta({ isExportacao, moeda, cotacaoAtual, cambio }) {
	if (!isExportacao) {
		return {
			moeda: "BRL",
			valorAtual: 1,
			valorUsado: 1,
			indiceAplicado: 1,
			origem: "mercado-interno",
			atualizadoEm: null,
		};
	}

	return {
		moeda,
		valorAtual: cotacaoAtual,
		valorUsado: cambio.valorUsado,
		indiceAplicado: cambio.indiceAplicado,
		origem: cambio.origem,
		atualizadoEm: null,
	};
}

async function executarCalculoLinha({
	linha,
	cotacaoUsd,
	cotacaoEur,
	cambioGlobal,
	payload,
}) {
	const isExportacao = resolverIsExportacao(linha);
	const moeda = isExportacao ? (linha.moeda === "EUR" ? "EUR" : "USD") : "BRL";
	const cotacao = isExportacao ? (moeda === "EUR" ? cotacaoEur : cotacaoUsd) : { valor: 1 };
	const cotacaoAtual = isExportacao ? toNumber(cotacao?.valor) : 1;

	if (isExportacao && cotacaoAtual <= 0) {
		throw new AppError("Não foi possível obter cotação atual para Simulação", 422);
	}

	const cambio = isExportacao
		? resolverCambioLinha({ linha, moeda, cotacaoAtual, cambioGlobal, payload })
		: { valorUsado: 1, indiceAplicado: 1, origem: "mercado-interno" };

	const culturaSelecionada = await resolverCultura({
		culturaId: linha.culturaId,
		cultura: linha.cultura,
	});

	const quantidadeSacas = toNumber(linha.quantidadeSacas);
	const valorSaca = toNumber(linha.valorSaca);
	const valorBruto = calcularValorBruto({
		isExportacao,
		quantidadeSacas,
		valorSaca,
		cambio,
		cotacaoAtual,
	});

	const composicaoTaxasBase = await buscarTaxasImpostosEstimados({
		cultura: culturaSelecionada.nome,
		valorBruto,
		quantidadeSacas,
		exportacao: isExportacao,
	});

	const composicaoTaxas = {
		...composicaoTaxasBase,
		isExportacao,
	};

	const taxasEImpostos = toNumber(composicaoTaxas.valorTotal);
	const valorLiquido = Math.max(valorBruto - taxasEImpostos, 0);

	return {
		cultura: culturaSelecionada,
		isExportacao,
		moeda,
		quantidadeSacas,
		valorSaca,
		valorBruto,
		composicaoTaxas,
		taxasEImpostos,
		valorLiquido,
		cotacao: montarCotacaoResposta({
			isExportacao,
			moeda,
			cotacaoAtual,
			cambio,
		}),
	};
}

async function executarCalculoCenario({ payload, dividas, cotacaoUsd, cotacaoEur }) {
	const linhas = normalizarLinhasPayload(payload);
	const cambioGlobal = payload.cambio ?? null;
	const resultadosLinhas = [];

	for (const linha of linhas) {
		const calculoLinha = await executarCalculoLinha({
			linha,
			cotacaoUsd,
			cotacaoEur,
			cambioGlobal,
			payload,
		});

		if (calculoLinha.isExportacao) {
			const cotacaoRef = calculoLinha.moeda === "EUR" ? cotacaoEur : cotacaoUsd;
			if (cotacaoRef?.atualizadoEm) {
				calculoLinha.cotacao.atualizadoEm = cotacaoRef.atualizadoEm;
			}
		}

		resultadosLinhas.push(calculoLinha);
	}

	const valorBruto = resultadosLinhas.reduce((acc, item) => acc + item.valorBruto, 0);
	const taxasEImpostos = resultadosLinhas.reduce((acc, item) => acc + item.taxasEImpostos, 0);
	const valorLiquido = resultadosLinhas.reduce((acc, item) => acc + item.valorLiquido, 0);
	const saldoAtualDivida = toNumber(dividas.totalPendente);
	const abatimentoAplicado = Math.min(valorLiquido, saldoAtualDivida);
	const novoSaldoDivida = Math.max(saldoAtualDivida - abatimentoAplicado, 0);
	const lucroSimuladoRestante = Math.max(valorLiquido - abatimentoAplicado, 0);
	const percentualAbatimento = saldoAtualDivida > 0 ? (abatimentoAplicado / saldoAtualDivida) * 100 : 0;

	const primeiraLinha = resultadosLinhas[0];

	return {
		linhas: resultadosLinhas,
		isExportacao: resultadosLinhas.some((item) => item.isExportacao),
		cultura: primeiraLinha?.cultura ?? null,
		quantidadeSacas: resultadosLinhas.reduce((acc, item) => acc + item.quantidadeSacas, 0),
		valorSaca: primeiraLinha?.valorSaca ?? 0,
		moeda: resultadosLinhas.length === 1 ? primeiraLinha.moeda : "MIX",
		cotacao: primeiraLinha?.cotacao ?? montarCotacaoResposta({
			isExportacao: false,
			moeda: "BRL",
			cotacaoAtual: 1,
			cambio: { valorUsado: 1, indiceAplicado: 1, origem: "mercado-interno" },
		}),
		valorBruto,
		composicaoTaxas: {
			cenarioMultiplo: resultadosLinhas.length > 1,
			linhas: resultadosLinhas.map((item) => ({
				culturaId: item.cultura.id,
				cultura: item.cultura.nome,
				isExportacao: item.isExportacao,
				moeda: item.moeda,
				quantidadeSacas: item.quantidadeSacas,
				valorSaca: item.valorSaca,
				valorBruto: item.valorBruto,
				valorLiquido: item.valorLiquido,
				taxasEImpostos: item.taxasEImpostos,
				composicaoTaxas: item.composicaoTaxas,
				cotacao: item.cotacao,
			})),
			percentual: valorBruto > 0 ? taxasEImpostos / valorBruto : 0,
			itens: [],
			fonte: "cenario-multiplo",
		},
		taxasEImpostos,
		valorLiquido,
		saldoAtualDivida,
		abatimentoAplicado,
		novoSaldoDivida,
		lucroSimuladoRestante,
		percentualAbatimento,
	};
}

async function executarCalculoSimulacao({
	payload,
	dividas,
	cotacaoUsd,
	cotacaoEur,
}) {
	return executarCalculoCenario({ payload, dividas, cotacaoUsd, cotacaoEur });
}

async function buscarTaxasImpostosEstimados({ cultura, valorBruto, quantidadeSacas, exportacao = true }) {
	const endpoint = process.env.TAX_ESTIMATOR_API_URL;
  const timeoutMs = Number(process.env.TAX_ESTIMATOR_TIMEOUT_MS ?? 6000);
  const apiKey = process.env.TAX_ESTIMATOR_API_KEY;

	if (!endpoint) {
		return await estimarTaxasInternas({ cultura, valorBruto, quantidadeSacas, exportacao });
	}

  const normalizarItemTaxa = (item) => {
    const nome = String(item?.nome ?? item?.name ?? item?.descricao ?? item?.label ?? "Taxa");
    const percentual = toNumber(item?.percentual ?? item?.rate ?? item?.aliquota);
    const valor = toNumber(item?.valor ?? item?.amount ?? item?.total);

    return {
      nome,
      percentual,
      valor,
    };
  };

  const normalizarRespostaTaxas = (payload) => {
    const raiz = payload?.data ?? payload?.resultado ?? payload?.taxas ?? payload;

    const itensRaw = raiz?.itens ?? raiz?.items ?? raiz?.breakdown ?? [];
    const itens = Array.isArray(itensRaw) ? itensRaw.map(normalizarItemTaxa) : [];

    const valorItens = itens.reduce((acc, item) => acc + toNumber(item.valor), 0);
    const valorTotal = toNumber(
      raiz?.valorTotal ??
        raiz?.total ??
        raiz?.totalAmount ??
        raiz?.estimatedTotal ??
        (valorItens > 0 ? valorItens : null),
    );

    const percentual = toNumber(
      raiz?.percentual ??
        raiz?.rate ??
        raiz?.totalRate ??
        (valorBruto > 0 ? valorTotal / valorBruto : 0),
    );

    return {
      percentual,
      itens,
      valorTotal,
      fonte: "api-externa",
    };
  };

	try {
		const { data } = await axios.post(
			endpoint,
			{
				cultura,
				valorBruto,
				quantidadeSacas,
				exportacao,
			},
			{
				timeout: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 6_000,
				headers: apiKey
					? {
						Authorization: `Bearer ${apiKey}`,
					}
					: undefined,
			},
		);

		const normalizado = normalizarRespostaTaxas(data);
		if (normalizado.valorTotal <= 0 && normalizado.itens.length === 0) {
			return await estimarTaxasInternas({ cultura, valorBruto, quantidadeSacas, exportacao });
		}

		return normalizado;
	} catch {
		return await estimarTaxasInternas({ cultura, valorBruto, quantidadeSacas, exportacao });
	}
}

async function resolverCultura({ culturaId, cultura }) {
	if (culturaId) {
		const culturaDb = await simulacaoRepository.buscarCulturaPorId(culturaId);
		if (!culturaDb) {
			throw new AppError("Cultura nao encontrada", 404);
		}

		return {
			id: culturaDb.id,
			nome: culturaDb.nome,
		};
	}

	return {
		id: null,
		nome: cultura,
	};
}

async function salvarSimulacao({
	usuarioId,
	fazendaId,
	culturaId,
	quantidadeSacas,
	valorSaca,
	moeda,
	taxaCambioManual,
	valorBruto,
	valorLiquido,
	composicaoTaxas,
	abatimentoDivida,
	novoSaldoDivida,
}) {
	return simulacaoRepository.criar({
		usuario_id: usuarioId,
		fazenda_id: fazendaId === "todas" ? null : fazendaId,
		cultura_id: culturaId,
		quantidade_sacas: quantidadeSacas,
		valor_saca: valorSaca,
		moeda,
		taxa_cambio_manual: taxaCambioManual,
		valor_bruto: valorBruto,
		valor_liquido: valorLiquido,
		composicao_taxas: composicaoTaxas,
		abatimento_divida: abatimentoDivida,
		novo_saldo_divida: novoSaldoDivida,
	});
}

export const simulacaoService = {
	buscarDividas: async ({ usuario, fazendaId = "todas" }) => {
		validarAcessoAdmin(usuario);

		const escopo = await resolverEscopo(usuario, fazendaId);
		const [totais, lucro] = await Promise.all([
			buscarResumoGastos(fazendaId, escopo.fazendaIds),
			buscarResumoLucro(fazendaId, escopo.fazendaIds),
		]);

		return {
			escopo: {
				tipo: escopo.escopo,
				fazendaId,
			},
			totais,
			lucro,
		};
	},

	calcularSacas: async ({ usuario, payload }) => {
		validarAcessoAdmin(usuario);

		const fazendaId = payload.fazendaId ?? "todas";
		const escopo = await resolverEscopo(usuario, fazendaId);
		const linhas = normalizarLinhasPayload(payload);
		const precisaUsd = linhas.some((linha) => resolverIsExportacao(linha) && (linha.moeda ?? "USD") !== "EUR");
		const precisaEur = linhas.some((linha) => resolverIsExportacao(linha) && linha.moeda === "EUR");

		const [dividas, lucro, cotacaoUsd, cotacaoEur] = await Promise.all([
			buscarResumoGastos(fazendaId, escopo.fazendaIds),
			buscarResumoLucro(fazendaId, escopo.fazendaIds),
			precisaUsd ? buscarCotacaoMoeda("USD") : Promise.resolve({ valor: 1 }),
			precisaEur ? buscarCotacaoMoeda("EUR") : Promise.resolve({ valor: 1 }),
		]);

		const calculo = await executarCalculoSimulacao({
			payload,
			dividas,
			cotacaoUsd,
			cotacaoEur,
		});

		return {
			escopo: {
				tipo: escopo.escopo,
				fazendaId,
			},
			linhas: calculo.linhas.map((linha) => ({
				cultura: linha.cultura,
				isExportacao: linha.isExportacao,
				moeda: linha.moeda,
				quantidadeSacas: linha.quantidadeSacas,
				valorSaca: linha.valorSaca,
				cotacao: linha.cotacao,
				resultado: {
					valorBruto: linha.valorBruto,
					taxasEImpostos: linha.taxasEImpostos,
					valorLiquido: linha.valorLiquido,
				},
				composicaoTaxas: linha.composicaoTaxas,
			})),
			cultura: calculo.cultura,
			isExportacao: calculo.isExportacao,
			quantidadeSacas: calculo.quantidadeSacas,
			valorSaca: calculo.valorSaca,
			cotacao: calculo.cotacao,
			lucro: {
				registrado: toNumber(lucro.totalLucro),
				simuladoLiquido: calculo.valorLiquido,
				restanteAposAbatimento: calculo.lucroSimuladoRestante,
				totalAposSimulacao: toNumber(lucro.totalLucro) + calculo.lucroSimuladoRestante,
			},
			resultado: {
				valorBruto: calculo.valorBruto,
				taxasEImpostos: calculo.taxasEImpostos,
				valorLiquido: calculo.valorLiquido,
				abatimentoAplicado: calculo.abatimentoAplicado,
				saldoAtualDivida: calculo.saldoAtualDivida,
				novoSaldoDivida: calculo.novoSaldoDivida,
				lucroSimuladoRestante: calculo.lucroSimuladoRestante,
				percentualAbatimento: calculo.percentualAbatimento,
			},
			composicaoTaxas: calculo.composicaoTaxas,
			calculadoEm: new Date().toISOString(),
		};
	},

	salvarSimulacao: async ({ usuario, payload }) => {
		validarAcessoAdmin(usuario);

		const fazendaId = payload.fazendaId ?? "todas";
		const escopo = await resolverEscopo(usuario, fazendaId);
		const linhas = normalizarLinhasPayload(payload);
		const precisaUsd = linhas.some((linha) => resolverIsExportacao(linha) && (linha.moeda ?? "USD") !== "EUR");
		const precisaEur = linhas.some((linha) => resolverIsExportacao(linha) && linha.moeda === "EUR");

		const [dividas, cotacaoUsd, cotacaoEur] = await Promise.all([
			buscarResumoGastos(fazendaId, escopo.fazendaIds),
			precisaUsd ? buscarCotacaoMoeda("USD") : Promise.resolve({ valor: 1 }),
			precisaEur ? buscarCotacaoMoeda("EUR") : Promise.resolve({ valor: 1 }),
		]);

		const calculoPayload = {
			...payload,
			linhas,
			...(payload.cambio ? { cambio: payload.cambio } : {}),
		};

		const calculo = await executarCalculoSimulacao({
			payload: calculoPayload,
			dividas,
			cotacaoUsd,
			cotacaoEur,
		});

		const primeiraCulturaId = linhas[0]?.culturaId ?? payload.culturaId;
		if (!primeiraCulturaId) {
			throw new AppError("Informe ao menos uma cultura na simulação", 400);
		}

		const salvo = await salvarSimulacao({
			usuarioId: usuario.id,
			fazendaId,
			culturaId: primeiraCulturaId,
			quantidadeSacas: calculo.quantidadeSacas,
			valorSaca: calculo.valorSaca,
			moeda: calculo.moeda === "MIX" ? "BRL" : calculo.moeda,
			taxaCambioManual: null,
			valorBruto: calculo.valorBruto,
			valorLiquido: calculo.valorLiquido,
			composicaoTaxas: calculo.composicaoTaxas,
			abatimentoDivida: calculo.abatimentoAplicado,
			novoSaldoDivida: calculo.novoSaldoDivida,
		});

		return salvo;
	},

	buscarHistorico: async ({ usuario, fazendaId = "todas", limite = 20 }) => {
		validarAcessoAdmin(usuario);

		await resolverEscopo(usuario, fazendaId);
		return simulacaoRepository.listarPorUsuario({
			usuarioId: usuario.id,
			fazendaId,
			limite,
		});
	},

	excluirSimulacao: async ({ usuario, id }) => {
		validarAcessoAdmin(usuario);

		const simulacao = await simulacaoRepository.buscarPorId(id);
		if (!simulacao) {
			throw new AppError("Simulacao nao encontrada", 404);
		}

		if (simulacao.usuario_id !== usuario.id) {
			throw new AppError("Sem permissao para excluir esta simulacao", 403);
		}

		await simulacaoRepository.excluir(id);
	},
};

