import { api } from "../api.js";

export async function buscarCotacaoDolar() {
	const { data } = await api.get("/cotacao/dolar");
	return data;
}

export async function buscarCotacaoEuro() {
	const { data } = await api.get("/cotacao/euro");
	return data;
}

export async function buscarPainelMercado() {
	const { data } = await api.get("/cotacao/mercado");
	return data;
}

