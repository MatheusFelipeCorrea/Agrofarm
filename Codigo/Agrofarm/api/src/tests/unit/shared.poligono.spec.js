import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppError } from "../../shared/errors/AppError.js";

vi.mock("../../database/client.js", () => ({
  prisma: {
    culturas: {
      findUnique: vi.fn(),
    },
  },
}));

import { validarDatasPoligono } from "../../shared/poligono/poligonoDatas.js";
import { resolverNomeTalhao } from "../../shared/poligono/poligonoNome.js";
import { prisma } from "../../database/client.js";

describe("poligonoDatas", () => {
  it("exige datas quando obrigatorias", () => {
    expect(() => validarDatasPoligono({ obrigatorias: true })).toThrow(AppError);
    expect(() =>
      validarDatasPoligono({ data_plantio: "2026-01-01", obrigatorias: true }),
    ).toThrow("A data de colheita é obrigatória");
  });

  it("rejeita datas invalidas", () => {
    expect(() =>
      validarDatasPoligono({ data_plantio: "data-invalida" }),
    ).toThrow("Data de plantio inválida");
    expect(() =>
      validarDatasPoligono({ data_colheita: "xxx" }),
    ).toThrow("Data de colheita inválida");
  });

  it("rejeita colheita anterior ao plantio", () => {
    expect(() =>
      validarDatasPoligono({ data_plantio: "2026-06-01", data_colheita: "2026-05-01" }),
    ).toThrow("A data de colheita deve ser igual ou posterior à data de plantio");
  });

  it("aceita datas validas ou ausentes", () => {
    expect(() => validarDatasPoligono({})).not.toThrow();
    expect(() =>
      validarDatasPoligono({ data_plantio: "2026-01-01", data_colheita: "2026-06-01" }),
    ).not.toThrow();
  });
});

describe("poligonoNome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna nome informado quando preenchido", async () => {
    const resultado = await resolverNomeTalhao({ nome: "  Talhão Norte  ", cultura_id: "c1" });
    expect(resultado).toBe("Talhão Norte");
    expect(prisma.culturas.findUnique).not.toHaveBeenCalled();
  });

  it("busca nome da cultura quando nome vazio", async () => {
    prisma.culturas.findUnique.mockResolvedValue({ nome: "  Soja  " });
    const resultado = await resolverNomeTalhao({ nome: "", cultura_id: "c1" });
    expect(resultado).toBe("Soja");
    expect(prisma.culturas.findUnique).toHaveBeenCalledWith({
      where: { id: "c1" },
      select: { nome: true },
    });
  });

  it("retorna null sem nome e sem cultura_id", async () => {
    expect(await resolverNomeTalhao({ nome: "  ", cultura_id: null })).toBeNull();

    prisma.culturas.findUnique.mockResolvedValue(null);
    expect(await resolverNomeTalhao({ nome: "", cultura_id: "c1" })).toBeNull();
    expect(await resolverNomeTalhao({ cultura_id: "c1" })).toBeNull();
  });
});
