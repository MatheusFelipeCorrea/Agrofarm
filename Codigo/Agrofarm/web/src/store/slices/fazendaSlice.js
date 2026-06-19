export const FAZENDA_TODAS_VALUE = "todas";

export function normalizarFazendaSelecionada(valor) {
	if (typeof valor !== "string") return FAZENDA_TODAS_VALUE;
	const v = valor.trim();
	return v.length > 0 ? v : FAZENDA_TODAS_VALUE;
}

export function createFazendaSlice(set) {
	return {
		fazendaSelecionada: FAZENDA_TODAS_VALUE,
		setFazendaSelecionada: (valor) =>
			set({ fazendaSelecionada: normalizarFazendaSelecionada(valor) }),
		resetFazendaSelecionada: () => set({ fazendaSelecionada: FAZENDA_TODAS_VALUE }),
	};
}
