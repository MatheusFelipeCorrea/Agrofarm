import { describe, expect, it } from "vitest";
import { validarDataPlantio, validarNomeArea, validarPoligono } from "./validatePolygon.js";

const poligonoValido = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-47.9, -15.8],
        [-47.89, -15.8],
        [-47.89, -15.79],
        [-47.9, -15.79],
        [-47.9, -15.8],
      ],
    ],
  },
};

describe("validatePolygon", () => {
  it("rejeita geometria ausente", () => {
    expect(validarPoligono(null)).toEqual({ valido: false, erro: "Geometria inválida" });
  });

  it("rejeita tipo diferente de Polygon", () => {
    expect(
      validarPoligono({
        geometry: { type: "Point", coordinates: [-47.9, -15.8] },
      }),
    ).toEqual({ valido: false, erro: "Geometria deve ser do tipo Polygon" });
  });

  it("rejeita poligono nao fechado", () => {
    const aberto = {
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-47.9, -15.8],
            [-47.89, -15.8],
            [-47.89, -15.79],
            [-47.9, -15.79],
          ],
        ],
      },
    };
    expect(validarPoligono(aberto)).toEqual({ valido: false, erro: "Polígono não está fechado" });
  });

  it("aceita poligono simples valido", () => {
    expect(validarPoligono(poligonoValido)).toEqual({ valido: true });
  });

  it("validarNomeArea exige nome", () => {
    expect(validarNomeArea("   ")).toEqual({ valido: false, erro: "Nome da área é obrigatório" });
    expect(validarNomeArea("Talhão A")).toEqual({ valido: true });
  });

  it("rejeita coordenadas fora dos limites", () => {
    const invalido = {
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-47.9, -15.8],
            [200, -15.8],
            [-47.89, -15.79],
            [-47.9, -15.79],
            [-47.9, -15.8],
          ],
        ],
      },
    };
    expect(validarPoligono(invalido).erro).toContain("Coordenadas fora dos limites");
  });

  it("validarNomeArea rejeita nome longo", () => {
    expect(validarNomeArea("a".repeat(101)).valido).toBe(false);
  });

  it("validarDataPlantio rejeita data futura", () => {
    const futuro = new Date();
    futuro.setFullYear(futuro.getFullYear() + 1);
    expect(validarDataPlantio(futuro.toISOString())).toEqual({
      valido: false,
      erro: "Data de plantio não pode ser futura",
    });
  });
});
