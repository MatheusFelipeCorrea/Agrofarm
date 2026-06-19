import { cotacaoService } from "../services/cotacao.service.js";

export const cotacaoController = {
	getDolar: async (_req, res, next) => {
		try {
			const cotacao = await cotacaoService.buscarDolar();
			return res.status(200).json(cotacao);
		} catch (error) {
			next(error);
		}
	},

	getEuro: async (_req, res, next) => {
		try {
			const cotacao = await cotacaoService.buscarEuro();
			return res.status(200).json(cotacao);
		} catch (error) {
			next(error);
		}
	},

	getPainelMercado: async (_req, res, next) => {
		try {
			const painel = await cotacaoService.buscarPainelMercado();
			return res.status(200).json(painel);
		} catch (error) {
			next(error);
		}
	},
};
