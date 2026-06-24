import { describe, expect, it } from "vitest";
import { calcularProdutividadeMedia, formatarProdutividadeMedia } from "./produtividade.js";

describe("produtividade", () => {
  it("calcularProdutividadeMedia calcula média ponderada", () => {
    expect(
      calcularProdutividadeMedia([
        { sacas: 100, area: 10 },
        { sacas: 50, area: 5 },
      ]),
    ).toBe(10);

    expect(calcularProdutividadeMedia([])).toBe(0);
    expect(calcularProdutividadeMedia([{ sacas: 10, area: 0 }])).toBe(0);
  });

  it("calcularProdutividadeMedia trata entrada não-array", () => {
    expect(calcularProdutividadeMedia(null)).toBe(0);
  });

  it("formatarProdutividadeMedia formata valor positivo em sc/ha", () => {
    expect(formatarProdutividadeMedia(12.34)).toContain("sc/ha");
    expect(formatarProdutividadeMedia(0)).toBe("—");
    expect(formatarProdutividadeMedia(null)).toBe("—");
  });
});
