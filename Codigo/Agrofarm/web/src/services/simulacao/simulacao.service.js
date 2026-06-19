import { api } from "../api.js";

function unwrapPayload(data) {
	if (data && typeof data === "object" && "data" in data && data.data != null) {
		return data.data;
	}
	return data;
}

export async function buscarDividas(fazendaId = "todas") {
	const { data } = await api.get("/simulacao/dividas", {
		params: { fazendaId: fazendaId || "todas" },
	});
	return unwrapPayload(data);
}

export async function calcularSacas(payload) {
	const { data } = await api.post("/simulacao/calcular-sacas", payload);
	return unwrapPayload(data);
}

export async function buscarCotacaoMoeda(moeda = "USD") {
	const endpoint = String(moeda).toUpperCase() === "EUR" ? "/cotacao/euro" : "/cotacao/dolar";
	const { data } = await api.get(endpoint);
	return unwrapPayload(data);
}

export async function buscarHistoricoSimulacoes(fazendaId = "todas", limite = 20) {
	const { data } = await api.get("/simulacao/historico", {
		params: {
			fazendaId: fazendaId || "todas",
			limite: Math.min(limite, 100),
		},
	});
	return unwrapPayload(data);
}

export async function salvarSimulacao(payload) {
	const { data } = await api.post("/simulacao/salvar", payload);
	return unwrapPayload(data);
}

export async function excluirSimulacao(id) {
	await api.delete(`/simulacao/${id}`);
}
