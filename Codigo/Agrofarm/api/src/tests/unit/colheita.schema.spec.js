import { describe, expect, it } from "vitest";
import { criarColheitaSchema, listarColheitasQuerySchema } from "../../schemas/colheita.schema.js";

const uuid = "550e8400-e29b-41d4-a716-446655440000";

describe("colheita.schema", () => {
  it("aceita criacao valida", () => {
    const resultado = criarColheitaSchema.parse({
      fazendaId: uuid,
      culturaId: uuid,
      dataColheita: "2026-05-10",
      sacasProduzidas: 100,
    });

    expect(resultado.sacasProduzidas).toBe(100);
  });

  it("rejeita sacasProduzidas nao positiva", () => {
    expect(() =>
      criarColheitaSchema.parse({
        fazendaId: uuid,
        culturaId: uuid,
        dataColheita: "2026-05-10",
        sacasProduzidas: 0,
      }),
    ).toThrow();
  });

  it("aceita fazendaId=all na listagem", () => {
    const resultado = listarColheitasQuerySchema.parse({ fazendaId: "all" });
    expect(resultado.fazendaId).toBe("all");
  });
});
