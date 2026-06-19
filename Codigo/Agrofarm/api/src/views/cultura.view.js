function hectaresParaJson(hectares) {
    if (hectares == null) return 0
    if (typeof hectares === 'object' && typeof hectares.toNumber === 'function') {
        return hectares.toNumber()
    }
    const n = Number(hectares)
    return Number.isFinite(n) ? n : 0
}

export const culturaView = {
    render: (cultura) => ({
        id: cultura.id,
        nome: cultura.nome,
        cor: cultura.cor,
        hectares: hectaresParaJson(cultura.hectares),
        criadoEm: cultura.criado_em,
    }),

    renderMany: (culturas) =>
        culturas.map((cultura) => ({
            id: cultura.id,
            nome: cultura.nome,
            cor: cultura.cor,
            hectares: hectaresParaJson(cultura.hectares),
            criadoEm: cultura.criado_em,
        })),
}
