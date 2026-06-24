function toNumber(value) {
	return Number(value ?? 0);
}

function renderLinhaCalculo(linha) {
	return {
		cultura: linha.cultura,
		isExportacao: linha.isExportacao !== false,
		moeda: linha.moeda ?? "BRL",
		quantidadeSacas: toNumber(linha.quantidadeSacas),
		valorSaca: toNumber(linha.valorSaca),
		cotacao: linha.cotacao
			? {
					moeda: linha.cotacao.moeda ?? "BRL",
					valorAtual: toNumber(linha.cotacao.valorAtual),
					valorUsado: toNumber(linha.cotacao.valorUsado),
					indiceAplicado: toNumber(linha.cotacao.indiceAplicado),
					origem: linha.cotacao.origem ?? "sistema",
					atualizadoEm: linha.cotacao.atualizadoEm ?? null,
				}
			: null,
		resultado: {
			valorBruto: toNumber(linha.resultado?.valorBruto ?? linha.valorBruto),
			taxasEImpostos: toNumber(linha.resultado?.taxasEImpostos ?? linha.taxasEImpostos),
			valorLiquido: toNumber(linha.resultado?.valorLiquido ?? linha.valorLiquido),
		},
		composicaoTaxas: linha.composicaoTaxas ?? null,
	};
}

export const simulacaoView = {
	renderDividas: ({ escopo, totais, lucro }) => ({
		escopo,
		totalPago: toNumber(totais?.totalPago),
		totalPendente: toNumber(totais?.totalPendente),
		totalGasto: toNumber(totais?.totalGasto),
		totalDivida: toNumber(totais?.totalPendente),
		lucroRegistrado: toNumber(lucro?.totalLucro),
	}),

	renderCalculo: (resultado) => ({
		escopo: resultado.escopo,
		linhas: Array.isArray(resultado.linhas) ? resultado.linhas.map(renderLinhaCalculo) : [],
		isExportacao: resultado.isExportacao !== false,
		cultura: resultado.cultura,
		quantidadeSacas: toNumber(resultado.quantidadeSacas),
		valorSaca: toNumber(resultado.valorSaca),
		cotacao: {
			moeda: resultado.cotacao?.moeda ?? "USD",
			valorAtual: toNumber(resultado.cotacao?.valorAtual),
			valorUsado: toNumber(resultado.cotacao?.valorUsado),
			indiceAplicado: toNumber(resultado.cotacao?.indiceAplicado),
			origem: resultado.cotacao?.origem ?? "sistema",
			atualizadoEm: resultado.cotacao?.atualizadoEm ?? null,
		},
		lucro: {
			registrado: toNumber(resultado.lucro?.registrado),
			simuladoLiquido: toNumber(resultado.lucro?.simuladoLiquido),
			restanteAposAbatimento: toNumber(resultado.lucro?.restanteAposAbatimento),
			totalAposSimulacao: toNumber(resultado.lucro?.totalAposSimulacao),
		},
		resultado: {
			valorBruto: toNumber(resultado.resultado?.valorBruto),
			taxasEImpostos: toNumber(resultado.resultado?.taxasEImpostos),
			valorLiquido: toNumber(resultado.resultado?.valorLiquido),
			abatimentoAplicado: toNumber(resultado.resultado?.abatimentoAplicado),
			saldoAtualDivida: toNumber(resultado.resultado?.saldoAtualDivida),
			novoSaldoDivida: toNumber(resultado.resultado?.novoSaldoDivida),
			lucroSimuladoRestante: toNumber(resultado.resultado?.lucroSimuladoRestante),
			percentualAbatimento: toNumber(resultado.resultado?.percentualAbatimento),
		},
		composicaoTaxas: {
			cenarioMultiplo: Boolean(resultado.composicaoTaxas?.cenarioMultiplo),
			linhas: Array.isArray(resultado.composicaoTaxas?.linhas)
				? resultado.composicaoTaxas.linhas
				: [],
			percentual: toNumber(resultado.composicaoTaxas?.percentual),
			itens: Array.isArray(resultado.composicaoTaxas?.itens)
				? resultado.composicaoTaxas.itens.map((item) => ({
						nome: item.nome,
						percentual: toNumber(item.percentual),
						valor: toNumber(item.valor),
					}))
				: [],
			fonte: resultado.composicaoTaxas?.fonte ?? "estimativa-interna",
			ncm: resultado.composicaoTaxas?.ncm ?? null,
			uf: resultado.composicaoTaxas?.uf ?? null,
			ibpt: resultado.composicaoTaxas?.ibpt ?? null,
		},
		calculadoEm: resultado.calculadoEm,
	}),

	renderHistorico: (simulacoes) => {
		return Array.isArray(simulacoes) ? simulacoes.map((sim) => ({
			id: sim.id,
			culturaId: sim.cultura_id,
			cultura: sim.culturas?.nome ?? "",
			fazendaId: sim.fazenda_id,
			fazenda: sim.fazendas?.nome ?? "Todas",
			quantidadeSacas: toNumber(sim.quantidade_sacas),
			valorSaca: toNumber(sim.valor_saca),
			moeda: sim.moeda,
			valorBruto: toNumber(sim.valor_bruto),
			valorLiquido: toNumber(sim.valor_liquido),
			abatimentoDivida: toNumber(sim.abatimento_divida),
			novoSaldoDivida: toNumber(sim.novo_saldo_divida),
			composicaoTaxas: sim.composicao_taxas,
			criadoEm: sim.criado_em,
		})) : [];
	},
};
