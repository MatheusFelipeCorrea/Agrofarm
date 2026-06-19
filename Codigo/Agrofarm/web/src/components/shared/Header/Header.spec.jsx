import { describe, expect, it } from "vitest";
import { buildFazendaOptions, getFazendaSelecionadaLabel } from "./headerFazenda.utils.js";

describe("headerFazenda.utils", () => {
  it("inclui opção fixa de Todas as Fazendas", () => {
    const options = buildFazendaOptions([{ id: "faz-1", nome: "Fazenda 1" }]);

    expect(options[0]).toEqual({ id: "todas", nome: "Todas as Fazendas" });
    expect(options[1]).toEqual({ id: "faz-1", nome: "Fazenda 1" });
  });

  it("resolve label da fazenda selecionada", () => {
    const options = buildFazendaOptions([
      { id: "faz-1", nome: "Fazenda 1" },
      { id: "faz-2", nome: "Fazenda 2" },
    ]);

    expect(getFazendaSelecionadaLabel(options, "faz-2")).toBe("Fazenda 2");
    expect(getFazendaSelecionadaLabel(options, "inexistente")).toBe("Todas as Fazendas");
  });
});
