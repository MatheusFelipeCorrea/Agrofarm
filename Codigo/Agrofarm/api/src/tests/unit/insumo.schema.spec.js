import { describe, expect, it } from "vitest";
import { criarInsumoSchema } from "../../schemas/insumo.schema.js";

const uuid = "550e8400-e29b-41d4-a716-446655440000";

describe("insumo.schema", () => {
  it("aceita criacao valida", () => {
    const resultado = criarInsumoSchema.parse({
      fazendaId: uuid,
      item: "Adubo NPK",
      categoria: "FERTILIZANTE",
      quantidade: 10,
      unidade: "kg",
      valorUnitario: 25.5,
      data: "2026-05-01",
    });

    expect(resultado.item).toBe("Adubo NPK");
    expect(resultado.categoria).toBe("FERTILIZANTE");
  });

  it("rejeita categoria invalida", () => {
    expect(() =>
      criarInsumoSchema.parse({
        fazendaId: uuid,
        item: "X",
        categoria: "INVALIDA",
        quantidade: 1,
        unidade: "kg",
        valorUnitario: 1,
        data: "2026-05-01",
      }),
    ).toThrow();
  });
});
