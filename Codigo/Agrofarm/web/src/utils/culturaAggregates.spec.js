import { describe, expect, it } from "vitest";
import {
  buildCulturaAggregatesFromFazendas,
  computeGlobalCulturaKpis,
  computeFazendaCulturaKpis,
  formatHa,
} from "./culturaAggregates.js";

describe("culturaAggregates", () => {
  it("buildCulturaAggregatesFromFazendas agrega por cultura", () => {
    const fazendas = [
      {
        culturas: [
          { cultura: { id: "c1" }, hectares: 10 },
          { culturaId: "c1", hectares: 5 },
        ],
      },
      {
        culturas: [{ cultura: { id: "c1" }, hectares: 20 }],
      },
      {
        culturas: [{ cultura: { id: "c2" }, hectares: 8 }],
      },
    ];

    const agg = buildCulturaAggregatesFromFazendas(fazendas);

    expect(agg.c1).toEqual({ fazendasVinculadas: 3, hectaresUsados: 35 });
    expect(agg.c2).toEqual({ fazendasVinculadas: 1, hectaresUsados: 8 });
  });

  it("buildCulturaAggregatesFromFazendas ignora vínculos sem culturaId", () => {
    expect(buildCulturaAggregatesFromFazendas([{ culturas: [{}] }])).toEqual({});
  });

  it("computeGlobalCulturaKpis calcula totais e média", () => {
    const culturas = [
      { id: "c1", hectares: 0 },
      { id: "c2", hectares: 5 },
    ];
    const aggregatesById = {
      c1: { fazendasVinculadas: 2, hectaresUsados: 20 },
      c2: { fazendasVinculadas: 1, hectaresUsados: 10 },
    };

    const kpis = computeGlobalCulturaKpis(culturas, aggregatesById);

    expect(kpis.totalCadastradas).toBe(2);
    expect(kpis.hectaresUtilizados).toBe(30);
    expect(kpis.areaMediaPorCultura).toBe(10);
  });

  it("computeGlobalCulturaKpis retorna zero quando não há vínculos", () => {
    const kpis = computeGlobalCulturaKpis([{ id: "c1", hectares: 12 }], {});

    expect(kpis.areaMediaPorCultura).toBe(0);
    expect(kpis.hectaresUtilizados).toBe(12);
  });

  it("computeFazendaCulturaKpis agrega vínculos da fazenda", () => {
    const kpis = computeFazendaCulturaKpis([
      { hectares: 10 },
      { hectares: 20 },
    ]);

    expect(kpis).toEqual({
      totalCadastradas: 2,
      hectaresUtilizados: 30,
      areaMediaPorCultura: 15,
    });
  });

  it("formatHa formata hectares em pt-BR", () => {
    expect(formatHa(1234.5)).toBe("1.235 ha");
    expect(formatHa("x")).toBe("0 ha");
    expect(formatHa(10, { maximumFractionDigits: 2 })).toContain("10");
  });
});
