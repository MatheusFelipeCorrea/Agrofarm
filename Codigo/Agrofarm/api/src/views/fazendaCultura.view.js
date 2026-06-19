function hectaresParaJson(hectares) {
    if (hectares == null) return 0
    if (typeof hectares === 'object' && typeof hectares.toNumber === 'function') {
        return hectares.toNumber()
    }
    const n = Number(hectares)
    return Number.isFinite(n) ? n : 0
}

export const fazendaCulturaView = {
    render: (vinculo) => ({
        id: vinculo.id,
        fazendaId: vinculo.fazenda_id,
        culturaId: vinculo.cultura_id,
        hectares: hectaresParaJson(vinculo.hectares),
        status: vinculo.status,
        criadoEm: vinculo.criado_em,
        cultura: vinculo.culturas
            ? {
                id: vinculo.culturas.id,
                nome: vinculo.culturas.nome,
                cor: vinculo.culturas.cor,
            }
            : null,
    }),

    renderMany: (vinculos) => vinculos.map((v) => fazendaCulturaView.render(v)),
}

