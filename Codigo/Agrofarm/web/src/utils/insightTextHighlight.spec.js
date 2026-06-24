import { describe, expect, it } from "vitest";
import { destacarAcoesMarkdown, splitTrechosAcao } from "./insightTextHighlight.js";

describe("insightTextHighlight", () => {
  it("destacarAcoesMarkdown retorna texto vazio sem alteração", () => {
    expect(destacarAcoesMarkdown("")).toBe("");
    expect(destacarAcoesMarkdown("   ")).toBe("   ");
    expect(destacarAcoesMarkdown(null)).toBe(null);
  });

  it("destacarAcoesMarkdown envolve trechos de ação em markdown bold", () => {
    const texto = "Recomenda-se aumentar investimentos em adubação neste ciclo.";
    const resultado = destacarAcoesMarkdown(texto);

    expect(resultado).toContain("**");
    expect(resultado.toLowerCase()).toContain("recomenda-se");
  });

  it("destacarAcoesMarkdown envolve novamente trechos já em bold quando o padrão casa", () => {
    const texto = "**Recomenda-se aumentar investimentos**";
    expect(destacarAcoesMarkdown(texto)).toBe("****Recomenda-se aumentar investimentos****");
  });

  it("splitTrechosAcao retorna trecho único sem highlight para texto vazio", () => {
    expect(splitTrechosAcao("")).toEqual([{ text: "", highlight: false }]);
    expect(splitTrechosAcao(null)).toEqual([{ text: "", highlight: false }]);
  });

  it("splitTrechosAcao separa trechos normais e de ação", () => {
    const texto = "Análise geral. Recomenda-se priorizar colheita antecipada.";
    const partes = splitTrechosAcao(texto);

    expect(partes.some((p) => p.highlight)).toBe(true);
    expect(partes.some((p) => !p.highlight)).toBe(true);
    expect(partes.map((p) => p.text).join("")).toBe(texto);
  });

  it("splitTrechosAcao retorna texto inteiro quando não há padrão de ação", () => {
    const texto = "Situação estável sem alertas.";
    expect(splitTrechosAcao(texto)).toEqual([{ text: texto, highlight: false }]);
  });
});
