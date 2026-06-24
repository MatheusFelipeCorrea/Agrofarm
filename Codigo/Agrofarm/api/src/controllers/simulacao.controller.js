import { simulacaoService } from "../services/simulacao.service.js";
import { simulacaoView } from "../views/simulacao.view.js";

export const simulacaoController = {
	buscarDividas: async (req, res, next) => {
		try {
			const resultado = await simulacaoService.buscarDividas({
				usuario: req.usuario,
				fazendaId: req.query.fazendaId,
			});

			return res.status(200).json({
				status: "success",
				data: simulacaoView.renderDividas(resultado),
			});
		} catch (error) {
			next(error);
		}
	},

	calcularSacas: async (req, res, next) => {
		try {
			const resultado = await simulacaoService.calcularSacas({
				usuario: req.usuario,
				payload: req.body,
			});

			return res.status(200).json({
				status: "success",
				data: simulacaoView.renderCalculo(resultado),
			});
		} catch (error) {
			next(error);
		}
	},

	salvarSimulacao: async (req, res, next) => {
		try {
			const simulacaoSalva = await simulacaoService.salvarSimulacao({
				usuario: req.usuario,
				payload: req.body,
			});

			return res.status(201).json({
				id: simulacaoSalva.id,
				criadoEm: simulacaoSalva.criado_em,
			});
		} catch (error) {
			next(error);
		}
	},

	buscarHistorico: async (req, res, next) => {
		try {
			const simulacoes = await simulacaoService.buscarHistorico({
				usuario: req.usuario,
				fazendaId: req.query.fazendaId || "todas",
				limite: Math.min(Number(req.query.limite || 20), 100),
			});

			return res.status(200).json(simulacaoView.renderHistorico(simulacoes));
		} catch (error) {
			next(error);
		}
	},

	excluirSimulacao: async (req, res, next) => {
		try {
			await simulacaoService.excluirSimulacao({
				usuario: req.usuario,
				id: req.params.id,
			});

			return res.status(204).send();
		} catch (error) {
			next(error);
		}
	},
};

