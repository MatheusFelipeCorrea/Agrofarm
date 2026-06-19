/**
 * Agrega hectares e contagem de fazendas por cultura a partir da lista de fazendas (com vínculos).
 */
export function buildCulturaAggregatesFromFazendas(fazendas = []) {
  const byCulturaId = {};
  fazendas.forEach((f) => {
    (f.culturas ?? []).forEach((v) => {
      const culturaId = v.cultura?.id ?? v.culturaId;
      if (!culturaId) return;
      if (!byCulturaId[culturaId]) {
        byCulturaId[culturaId] = { fazendasVinculadas: 0, hectaresUsados: 0 };
      }
      byCulturaId[culturaId].fazendasVinculadas += 1;
      byCulturaId[culturaId].hectaresUsados += Number(v.hectares ?? 0);
    });
  });
  return byCulturaId;
}

export function computeGlobalCulturaKpis(culturas = [], aggregatesById = {}) {
  const totalCadastradas = culturas.length;
  let hectaresUtilizados = 0;
  let somaMediaPorFazenda = 0;
  let culturasComVinculo = 0;

  culturas.forEach((c) => {
    const agg = aggregatesById[c.id];
    const ha = agg?.hectaresUsados ?? Number(c.hectares ?? 0);
    hectaresUtilizados += ha;
    const fazendas = agg?.fazendasVinculadas ?? 0;
    if (fazendas > 0) {
      somaMediaPorFazenda += ha / fazendas;
      culturasComVinculo += 1;
    }
  });

  const areaMediaPorCultura =
    culturasComVinculo > 0 ? somaMediaPorFazenda / culturasComVinculo : 0;

  return { totalCadastradas, hectaresUtilizados, areaMediaPorCultura };
}

export function computeFazendaCulturaKpis(vinculos = []) {
  const total = vinculos.length;
  const hectaresUtilizados = vinculos.reduce((s, v) => s + Number(v.hectares ?? 0), 0);
  const areaMediaPorCultura = total > 0 ? hectaresUtilizados / total : 0;
  return { totalCadastradas: total, hectaresUtilizados, areaMediaPorCultura };
}

export function formatHa(value, { maximumFractionDigits = 0 } = {}) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0 ha";
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits })} ha`;
}
