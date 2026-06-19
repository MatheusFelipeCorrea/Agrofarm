import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiErrorToast, apiSuccessToast } from "../../lib/mutationProps.js";
import {
	buscarCotacaoMoeda,
	buscarDividas,
	calcularSacas,
	buscarHistoricoSimulacoes,
	salvarSimulacao,
	excluirSimulacao,
} from "../../services/simulacao/simulacao.service.js";

const SIMULACAO_QUERY_KEY = ["simulacao"];

export function useGetDividasSimulacao(fazendaId, options = {}) {
	return useQuery({
		queryKey: [...SIMULACAO_QUERY_KEY, "dividas", fazendaId || "todas"],
		queryFn: () => buscarDividas(fazendaId || "todas"),
		staleTime: 15_000,
		retry: 1,
		...options,
	});
}

export function useCalcularSacasMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: calcularSacas,
		...apiErrorToast("Não foi possível executar a Simulação."),
		...apiSuccessToast("Simulação executada com sucesso."),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [...SIMULACAO_QUERY_KEY, "dividas"] });
		},
	});
}

export function useCotacaoSimulacaoQuery(moeda = "USD", options = {}) {
	const moedaNormalizada = String(moeda || "USD").toUpperCase();

	return useQuery({
		queryKey: [...SIMULACAO_QUERY_KEY, "cotacao", moedaNormalizada],
		queryFn: () => buscarCotacaoMoeda(moedaNormalizada),
		staleTime: 2 * 60 * 60 * 1000, // 2 horas - não re-buscar ao mudar de moeda
		retry: 1,
		gcTime: 10 * 60 * 1000, // Manter em cache por 10 minutos
		...options,
	});
}

export function usePré_carregarCotacoes() {
	const queryClient = useQueryClient();

	useEffect(() => {
		// Pré-carregar USD
		queryClient.prefetchQuery({
			queryKey: [...SIMULACAO_QUERY_KEY, "cotacao", "USD"],
			queryFn: () => buscarCotacaoMoeda("USD"),
			staleTime: 2 * 60 * 60 * 1000,
		});

		// Pré-carregar EUR
		queryClient.prefetchQuery({
			queryKey: [...SIMULACAO_QUERY_KEY, "cotacao", "EUR"],
			queryFn: () => buscarCotacaoMoeda("EUR"),
			staleTime: 2 * 60 * 60 * 1000,
		});
	}, [queryClient]);
}

export function useSalvarSimulacaoMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: salvarSimulacao,
		...apiErrorToast("Não foi possível salvar a Simulação."),
		...apiSuccessToast("Simulação salva com sucesso."),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [...SIMULACAO_QUERY_KEY, "historico"] });
		},
	});
}

export function useBuscarSimulacaoHistorico(fazendaId, options = {}) {
	return useQuery({
		queryKey: [...SIMULACAO_QUERY_KEY, "historico", fazendaId || "todas"],
		queryFn: () => buscarHistoricoSimulacoes(fazendaId || "todas", 20),
		staleTime: 30_000,
		retry: 1,
		enabled: false,
		...options,
	});
}

export function useExcluirSimulacaoMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: excluirSimulacao,
		...apiErrorToast("Não foi possível excluir a simulação."),
		...apiSuccessToast("Simulação excluída com sucesso."),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [...SIMULACAO_QUERY_KEY, "historico"] });
		},
	});
}

