import { describe, expect, it } from "vitest";
import { createFazendaSchema, updateFazendaSchema } from "../../schemas/fazenda.schema.js";
import { createCulturaSchema, updateCulturaSchema } from "../../schemas/cultura.schema.js";
import { criarLembreteSchema } from "../../schemas/lembrete.schema.js";
import {
  createFazendaCulturaSchema,
  updateFazendaCulturaSchema,
} from "../../schemas/fazendaCultura.schema.js";

const uuid = "550e8400-e29b-41d4-a716-446655440000";

describe("schemas extras", () => {
  it("fazenda create e update", () => {
    expect(
      createFazendaSchema.parse({
        nome: "Fazenda Norte",
        tipo: "PROPRIA",
        localizacao: "Patos de Minas",
      }).nome,
    ).toBe("Fazenda Norte");

    expect(updateFazendaSchema.parse({ nome: "Novo nome" }).nome).toBe("Novo nome");

    expect(
      createFazendaSchema.parse({
        nome: "Arrendada Sul",
        tipo: "ARRENDADA_PARA_TERCEIROS",
        arrendamentoValor: 12000,
        arrendamentoPeriodicidade: "MENSAL",
        arrendamentoDataInicio: "2026-01-10",
      }).arrendamentoPeriodicidade,
    ).toBe("MENSAL");
  });

  it("cultura create com cor hex", () => {
    expect(
      createCulturaSchema.parse({ nome: "Soja", cor: "#1a2b3c", hectares: 10 }).cor,
    ).toBe("#1a2b3c");
    expect(updateCulturaSchema.parse({ cor: "#abcdef" }).cor).toBe("#abcdef");
  });

  it("lembrete create valido", () => {
    const resultado = criarLembreteSchema.parse({
      fazendaId: uuid,
      titulo: "Aplicar defensivo",
      dataLembrete: new Date("2026-05-10T10:00:00"),
      telefoneWhatsapp: "31999998888",
      recorrencia: "NENHUMA",
    });
    expect(resultado.titulo).toBe("Aplicar defensivo");
  });

  it("fazendaCultura schemas", () => {
    expect(
      createFazendaCulturaSchema.parse({
        culturaId: uuid,
        status: "PLANTIO",
      }).status,
    ).toBe("PLANTIO");

    expect(updateFazendaCulturaSchema.parse({ status: "COLHEITA" }).status).toBe("COLHEITA");
  });
});
