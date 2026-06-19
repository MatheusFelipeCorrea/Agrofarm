
function sliceSafe(lista, max) {
  return Array.isArray(lista) ? lista.slice(0, max) : [];
}

function resumirMercado(mercado) {
  if (!mercado) return { dolar: null, euro: null, commodities: [] };
  return {
    dolar: mercado.dolar ?? null,
    euro: mercado.euro ?? null,
    commodities: sliceSafe(mercado.commodities, 12).map((c) => ({
      id: c.id,
      nome: c.nome,
      valor: c.valor,
      variacao: c.variacao,
      unidade: c.unidade,
      moeda: c.moeda,
    })),
  };
}

function resumirFazendas(fazendas) {
  return (fazendas ?? []).map((f) => ({
    id: f.id,
    nome: f.nome,
    tipo: f.tipo,
    localizacao: f.localizacao,
    hectaresTotais: f.hectaresTotais,
    culturasVinculadas: f.culturasVinculadas,
    financeiro: f.financeiro
      ? {
          totalLucros: f.financeiro.totalLucros,
          totalGastos: f.financeiro.totalGastos,
          saldo: f.financeiro.saldo,
        }
      : null,
    estoqueSacas: f.estoque?.totalSacas ?? 0,
    producaoSacas: f.producao?.totalSacas ?? 0,
    produtividadeMediaSacasHa: f.producao?.produtividadeMedia ?? 0,
  }));
}

/**
 * @param {object} ctx — contexto completo de montarContextoCompleto
 * @param {{ dadosPreCalculados?: string|null, fazendaAlvo?: object|null }} [opts]
 */
export function compactarContextoParaGemini(ctx, opts = {}) {
  const { dadosPreCalculados = null, fazendaAlvo = null } = opts;

  const base = {
    geradoEm: ctx.geradoEm,
    escopo: ctx.escopo,
    usuario: ctx.usuario,
    resumoGeral: ctx.resumoGeral,
    mercado: resumirMercado(ctx.mercado),
    culturaVsMercado: ctx.culturaVsMercado,
    sinaisPorFazenda: ctx.sinaisPorFazenda,
    comparativoFazendas: ctx.comparativoFazendas,
    fazendas: resumirFazendas(ctx.fazendas),
    producaoPorCultura: ctx.producaoPorCulturaAgregada,
    estoquePorCultura: ctx.estoqueResumoAgregado,
    estoquePorFazenda: sliceSafe(ctx.estoquePorFazenda, 20),
    gastosPorTipo: sliceSafe(ctx.gastosPorTipo, 10),
    maiorGasto: ctx.maiorGastoGlobal,
    ultimasMovimentacoes: sliceSafe(ctx.ultimasMovimentacoesFinanceiras, 10),
    ultimosGastos: sliceSafe(ctx.ultimosGastos, 8),
    ultimosLucros: sliceSafe(ctx.ultimosLucros, 8),
    lembretesRecentes: sliceSafe(ctx.lembretesRecentes, 8),
    insumosRecentes: sliceSafe(ctx.insumosRecentes, 5),
    modulosAgroFarm: ctx.modulosAgroFarm,
    formatoAnalise: ctx.formatoRecomendadoAnalise,
  };

  if (dadosPreCalculados) {
    base.dadosPreCalculados = dadosPreCalculados;
  }

  if (fazendaAlvo) {
    base.focoPergunta = {
      fazendaId: fazendaAlvo.id,
      fazendaNome: fazendaAlvo.nome,
      detalhe: resumirFazendas([fazendaAlvo])[0] ?? null,
    };
  }

  return base;
}
