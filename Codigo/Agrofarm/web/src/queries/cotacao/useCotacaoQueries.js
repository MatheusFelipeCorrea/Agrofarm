import { useQuery } from "@tanstack/react-query";
import {
	buscarCotacaoDolar,
	buscarCotacaoEuro,
	buscarPainelMercado,
} from "../../services/cotacao/cotacao.service.js";

export const COTACAO_QUERY_KEY = ["cotacao", "dolar"];
export const COTACAO_EURO_QUERY_KEY = ["cotacao", "euro"];
export const COTACAO_MERCADO_QUERY_KEY = ["cotacao", "mercado"];

export function getCotacaoDolarQueryOptions() {
	return {
		queryKey: COTACAO_QUERY_KEY,
		queryFn: buscarCotacaoDolar,
		staleTime: 60_000,
		retry: 1,
	};
}

export function useCotacaoDolarQuery(options = {}) {
	return useQuery({
		...getCotacaoDolarQueryOptions(),
		...options,
	});
}

export function getCotacaoEuroQueryOptions() {
	return {
		queryKey: COTACAO_EURO_QUERY_KEY,
		queryFn: buscarCotacaoEuro,
		staleTime: 60_000,
		retry: 1,
	};
}

export function useCotacaoEuroQuery(options = {}) {
	return useQuery({
		...getCotacaoEuroQueryOptions(),
		...options,
	});
}

export function getCotacaoMercadoQueryOptions() {
	return {
		queryKey: COTACAO_MERCADO_QUERY_KEY,
		queryFn: buscarPainelMercado,
		staleTime: 60_000,
		retry: 1,
	};
}

export function useCotacaoMercadoQuery(options = {}) {
	return useQuery({
		...getCotacaoMercadoQueryOptions(),
		...options,
	});
}

