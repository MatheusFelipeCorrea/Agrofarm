/**
 * NCM (8 dígitos) por cultura — base Comex/IBPT para commodities agrícolas.
 * Chave: nome normalizado (sem acento, minúsculo).
 */
export const NCM_POR_CULTURA = {
	cafe: { ncm: "09011110", descricao: "Cafe nao torrado, nao descafeinado" },
	soja: { ncm: "12010000", descricao: "Soja, mesmo triturada" },
	milho: { ncm: "10059010", descricao: "Milho, exceto para semeadura" },
	trigo: { ncm: "10019900", descricao: "Trigo e mistura de trigo com centeio" },
	algodao: { ncm: "52010000", descricao: "Algodao em bruto" },
	arroz: { ncm: "10063021", descricao: "Arroz beneficiado" },
	feijao: { ncm: "07133319", descricao: "Feijao comum" },
	cana: { ncm: "17011400", descricao: "Acucar de cana, em bruto" },
	acucar: { ncm: "17011400", descricao: "Acucar de cana, em bruto" },
};

export function normalizarNomeCultura(nome) {
	return String(nome ?? "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();
}

export function resolverNcmCultura(nomeCultura) {
	const chave = normalizarNomeCultura(nomeCultura);
	const direto = NCM_POR_CULTURA[chave];
	if (direto) return direto;

	const parcial = Object.entries(NCM_POR_CULTURA).find(([k]) => chave.includes(k) || k.includes(chave));
	return parcial?.[1] ?? null;
}
