export const cotacaoView = {
	renderMoeda: (cotacao) => {
		if (!cotacao) {
			return {
				valor: null,
				variacao: null,
				fonte: null,
				atualizadoEm: null,
			};
		}

		return {
			valor: Number(cotacao.valor ?? 0),
			variacao: cotacao.variacao == null ? null : Number(cotacao.variacao),
			fonte: cotacao.fonte ?? null,
			atualizadoEm: cotacao.atualizado_em ?? null,
		};
	},

	renderDolar: (cotacao) => {
		return cotacaoView.renderMoeda(cotacao);
	},

	renderMercado: ({ dolar, euro, commodities }) => ({
		dolar: cotacaoView.renderMoeda(dolar),
		euro: cotacaoView.renderMoeda(euro),
		commodities: Array.isArray(commodities)
			? commodities.map((item) => ({
				id: item.id,
				nome: item.nome,
				symbol: item.symbol,
				unidade: item.unidade,
				valor: item.valor == null ? null : Number(item.valor),
				variacao: item.variacao == null ? null : Number(item.variacao),
				moeda: item.moeda ?? null,
				fonte: item.fonte ?? null,
				atualizadoEm: item.atualizadoEm ?? null,
			}))
			: [],
	}),
};
