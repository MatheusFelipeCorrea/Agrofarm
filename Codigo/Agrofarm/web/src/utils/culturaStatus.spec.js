import { describe, expect, it } from "vitest";
import {
  isCulturaCafe,
  statusPermitidosParaCultura,
  statusPadraoParaCultura,
  statusValidoParaCultura,
  somarHectaresTalhoes,
  contarTalhoesPorCultura,
} from "./culturaStatus.js";

describe("culturaStatus", () => {
  it("isCulturaCafe reconhece variações de café", () => {
    expect(isCulturaCafe("Café")).toBe(true);
    expect(isCulturaCafe("cafe arábica")).toBe(true);
    expect(isCulturaCafe("Soja")).toBe(false);
    expect(isCulturaCafe(null)).toBe(false);
  });

  it("statusPermitidosParaCultura inclui SECAGEM apenas para café", () => {
    const cafe = statusPermitidosParaCultura("Café").map((s) => s.value);
    const soja = statusPermitidosParaCultura("Soja").map((s) => s.value);

    expect(cafe).toContain("SECAGEM");
    expect(soja).not.toContain("SECAGEM");
    expect(soja).toEqual(["PLANTIO", "COLHEITA", "ADUBACAO", "PULVERIZACAO"]);
  });

  it("statusPadraoParaCultura retorna SECAGEM para café e PLANTIO para demais", () => {
    expect(statusPadraoParaCultura("Café")).toBe("SECAGEM");
    expect(statusPadraoParaCultura("Milho")).toBe("PLANTIO");
  });

  it("statusValidoParaCultura valida contra lista permitida", () => {
    expect(statusValidoParaCultura("Café", "SECAGEM")).toBe(true);
    expect(statusValidoParaCultura("Café", "PLANTIO")).toBe(true);
    expect(statusValidoParaCultura("Soja", "SECAGEM")).toBe(false);
    expect(statusValidoParaCultura("Soja", "COLHEITA")).toBe(true);
  });

  it("somarHectaresTalhoes soma área dos talhões da cultura", () => {
    const poligonos = [
      { cultura_id: "c1", area_hectares: 10 },
      { cultura: { id: "c1" }, area_hectares: 5 },
      { cultura_id: "c2", area_hectares: 20 },
    ];

    expect(somarHectaresTalhoes(poligonos, "c1")).toBe(15);
    expect(somarHectaresTalhoes(poligonos, null)).toBe(0);
    expect(somarHectaresTalhoes(null, "c1")).toBe(0);
  });

  it("contarTalhoesPorCultura conta polígonos da cultura", () => {
    const poligonos = [
      { cultura_id: "c1" },
      { cultura: { id: "c1" } },
      { cultura_id: "c2" },
    ];

    expect(contarTalhoesPorCultura(poligonos, "c1")).toBe(2);
    expect(contarTalhoesPorCultura(poligonos, "c3")).toBe(0);
  });
});
