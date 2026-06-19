import axios from "axios";
import { AppError } from "../shared/errors/AppError.js";
import { cotacaoService } from "./cotacao.service.js";
import { dashboardRepository } from "../repositories/dashboard.repository.js";
import { gastoRepository } from "../repositories/gasto.repository.js";
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

async function buscarResumoGastos(fazendaId) {
	const filters =
		fazendaId && fazendaId !== "todas"
			? { fazendaId }
			: {};

	return gastoRepository.buscarResumoComFiltros({
		filters,
		role: "ADMIN",
		fazendasPermitidas: [],
	});
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

async function executarCalculoSimulacao({
	payload,
	dividas,
	culturaSelecionada,
	cotacao,
}) {
	const isExportacao = resolverIsExportacao(payload);
	const moeda = isExportacao ? (payload.moeda === "EUR" ? "EUR" : "USD") : "BRL";
	const cotacaoAtual = isExportacao ? toNumber(cotacao?.valor) : 1;

	if (isExportacao && cotacaoAtual <= 0) {
		throw new AppError("Não foi possível obter cotação atual para Simulação", 422);
	}

	const cambio = isExportacao
		? calcularIndiceCambio({
			valorAtual: cotacaoAtual,
			usd: payload.usd,
			brl: payload.brl,
		})
		: { valorUsado: 1, indiceAplicado: 1, origem: "mercado-interno" };

	const quantidadeSacas = toNumber(payload.quantidadeSacas);
	const valorSaca = toNumber(payload.valorSaca);
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
	const saldoAtualDivida = toNumber(dividas.totalPendente);
	const abatimentoAplicado = Math.min(valorLiquido, saldoAtualDivida);
	const novoSaldoDivida = Math.max(saldoAtualDivida - abatimentoAplicado, 0);
	const percentualAbatimento = saldoAtualDivida > 0 ? (abatimentoAplicado / saldoAtualDivida) * 100 : 0;

	return {
		isExportacao,
		moeda,
		quantidadeSacas,
		valorSaca,
		valorBruto,
		composicaoTaxas,
		taxasEImpostos,
		valorLiquido,
		saldoAtualDivida,
		abatimentoAplicado,
		novoSaldoDivida,
		percentualAbatimento,
		cotacao: montarCotacaoResposta({
			isExportacao,
			moeda,
			cotacaoAtual,
			cambio,
		}),
	};
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
		const totais = await buscarResumoGastos(fazendaId);

		return {
			escopo: {
				tipo: escopo.escopo,
				fazendaId,
			},
			totais,
		};
	},

	calcularSacas: async ({ usuario, payload }) => {
		validarAcessoAdmin(usuario);

		const fazendaId = payload.fazendaId ?? "todas";
		const escopo = await resolverEscopo(usuario, fazendaId);
		const isExportacao = resolverIsExportacao(payload);
		const moedaConsulta = isExportacao ? (payload.moeda === "EUR" ? "EUR" : "USD") : "USD";

		const [dividas, culturaSelecionada, cotacao] = await Promise.all([
			buscarResumoGastos(fazendaId),
			resolverCultura({ culturaId: payload.culturaId, cultura: payload.cultura }),
			isExportacao ? buscarCotacaoMoeda(moedaConsulta) : Promise.resolve({ valor: 1 }),
		]);

		const calculo = await executarCalculoSimulacao({
			payload,
			dividas,
			culturaSelecionada,
			cotacao,
		});

		if (isExportacao && cotacao?.atualizadoEm) {
			calculo.cotacao.atualizadoEm = cotacao.atualizadoEm;
		}

		return {
			escopo: {
				tipo: escopo.escopo,
				fazendaId,
			},
			cultura: culturaSelecionada,
			isExportacao: calculo.isExportacao,
			quantidadeSacas: calculo.quantidadeSacas,
			valorSaca: calculo.valorSaca,
			cotacao: calculo.cotacao,
			resultado: {
				valorBruto: calculo.valorBruto,
				taxasEImpostos: calculo.taxasEImpostos,
				valorLiquido: calculo.valorLiquido,
				abatimentoAplicado: calculo.abatimentoAplicado,
				saldoAtualDivida: calculo.saldoAtualDivida,
				novoSaldoDivida: calculo.novoSaldoDivida,
				percentualAbatimento: calculo.percentualAbatimento,
			},
			composicaoTaxas: calculo.composicaoTaxas,
			calculadoEm: new Date().toISOString(),
		};
	},

	salvarSimulacao: async ({ usuario, payload }) => {
		validarAcessoAdmin(usuario);

		const fazendaId = payload.fazendaId ?? "todas";
		await resolverEscopo(usuario, fazendaId);

		// Nunca confiar nos valores derivados enviados pelo cliente: recalcula
		// bruto, taxas, líquido e abatimento de dívida no servidor.
		const isExportacao = resolverIsExportacao(payload);
		const moedaConsulta = isExportacao ? (payload.moeda === "EUR" ? "EUR" : "USD") : "USD";

		const [dividas, culturaSelecionada, cotacao] = await Promise.all([
			buscarResumoGastos(fazendaId),
			resolverCultura({ culturaId: payload.culturaId, cultura: payload.cultura }),
			isExportacao ? buscarCotacaoMoeda(moedaConsulta) : Promise.resolve({ valor: 1 }),
		]);

		const calculoPayload = {
			...payload,
			isExportacao,
			moeda: isExportacao ? moedaConsulta : "BRL",
			...(isExportacao && toNumber(payload.taxaCambioManual) > 0
				? { usd: 1, brl: toNumber(payload.taxaCambioManual) }
				: {}),
		};

		const calculo = await executarCalculoSimulacao({
			payload: calculoPayload,
			dividas,
			culturaSelecionada,
			cotacao,
		});

		const salvo = await salvarSimulacao({
			usuarioId: usuario.id,
			fazendaId,
			culturaId: payload.culturaId,
			quantidadeSacas: calculo.quantidadeSacas,
			valorSaca: calculo.valorSaca,
			moeda: calculo.moeda,
			taxaCambioManual:
				isExportacao && calculo.cotacao.origem === "manual"
					? toNumber(calculo.cotacao.valorUsado)
					: null,
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

