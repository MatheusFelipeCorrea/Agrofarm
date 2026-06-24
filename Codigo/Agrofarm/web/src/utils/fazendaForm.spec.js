import { describe, expect, it } from "vitest";
import {
  TIPOS_FAZENDA,
  SITUACAO_FAZENDA,
  emptyFazendaForm,
  mapFazendaToForm,
  buildFazendaPayload,
  validateFazendaForm,
} from "./fazendaForm.js";

describe("fazendaForm", () => {
  it("exporta opções de tipo e situação", () => {
    expect(TIPOS_FAZENDA).toHaveLength(3);
    expect(SITUACAO_FAZENDA.map((s) => s.value)).toEqual(["ativa", "inativa"]);
  });

  it("emptyFazendaForm retorna valores padrão", () => {
    const form = emptyFazendaForm();
    expect(form).toMatchObject({
      nome: "",
      localizacao: "",
      ativa: true,
      tipo: "PROPRIA",
      arrendamentoPeriodicidade: "MENSAL",
    });
    expect(form.latitude).toBeUndefined();
    expect(form.longitude).toBeUndefined();
  });

  it("mapFazendaToForm retorna vazio quando fazenda é nula", () => {
    expect(mapFazendaToForm(null)).toEqual(emptyFazendaForm());
  });

  it("mapFazendaToForm mapeia fazenda própria", () => {
    const form = mapFazendaToForm({
      nome: "Fazenda A",
      localizacao: "MG",
      latitude: -19.9,
      longitude: -43.9,
      ativa: false,
      tipo: "PROPRIA",
    });

    expect(form).toMatchObject({
      nome: "Fazenda A",
      localizacao: "MG",
      latitude: -19.9,
      longitude: -43.9,
      ativa: false,
      tipo: "PROPRIA",
    });
  });

  it("mapFazendaToForm mapeia arrendamento quando tipo é ARRENDADA_PARA_TERCEIROS", () => {
    const form = mapFazendaToForm({
      nome: "Arrendada",
      tipo: "ARRENDADA_PARA_TERCEIROS",
      arrendamento: {
        culturaId: "c1",
        quantidadeSacas: 50,
        periodicidade: "ANUAL",
        dataInicio: "2026-01-15",
      },
    });

    expect(form.arrendamentoCulturaId).toBe("c1");
    expect(form.arrendamentoQuantidadeSacas).toBe("50");
    expect(form.arrendamentoPeriodicidade).toBe("ANUAL");
    expect(form.arrendamentoDataInicio).toBe("2026-01-15");
  });

  it("buildFazendaPayload normaliza campos e inclui coordenadas", () => {
    const payload = buildFazendaPayload({
      nome: "  Minha Fazenda  ",
      localizacao: "  ",
      tipo: "PROPRIA",
      ativa: true,
      latitude: -20,
      longitude: -44,
    });

    expect(payload).toEqual({
      nome: "Minha Fazenda",
      localizacao: undefined,
      tipo: "PROPRIA",
      ativa: true,
      latitude: -20,
      longitude: -44,
    });
  });

  it("buildFazendaPayload inclui arrendamento para ARRENDADA_PARA_TERCEIROS", () => {
    const payload = buildFazendaPayload({
      nome: "Arrendada",
      tipo: "ARRENDADA_PARA_TERCEIROS",
      ativa: true,
      arrendamentoCulturaId: "c2",
      arrendamentoQuantidadeSacas: "10,5",
      arrendamentoPeriodicidade: "MENSAL",
      arrendamentoDataInicio: "2026-06-01",
    });

    expect(payload.arrendamentoCulturaId).toBe("c2");
    expect(payload.arrendamentoQuantidadeSacas).toBe(10.5);
  });

  it("validateFazendaForm exige nome", () => {
    expect(validateFazendaForm({ nome: "  " })).toBe("Informe o nome da fazenda.");
    expect(validateFazendaForm({ nome: "OK", tipo: "PROPRIA" })).toBeNull();
  });

  it("validateFazendaForm valida arrendamento para ARRENDADA_PARA_TERCEIROS", () => {
    const erro = validateFazendaForm({
      nome: "Arrendada",
      tipo: "ARRENDADA_PARA_TERCEIROS",
      arrendamentoCulturaId: "",
      arrendamentoQuantidadeSacas: "0",
      arrendamentoPeriodicidade: "MENSAL",
      arrendamentoDataInicio: "2026-01-01",
    });

    expect(erro).toBe("Selecione a cultura recebida no arrendamento.");
  });
});
