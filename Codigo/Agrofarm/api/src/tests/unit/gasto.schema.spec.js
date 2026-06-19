import { describe, expect, it } from "vitest";
import { criarGastoSchema, listarGastosQuerySchema } from "../../schemas/gasto.schema.js";

const uuid = "550e8400-e29b-41d4-a716-446655440000";

describe("gasto.schema", () => {
  it("aceita payload valido de criacao", () => {
    const resultado = criarGastoSchema.parse({
      colheitaId: uuid,
      tipo: "ADUBO",
      valor: 100,
      data: "2026-05-01",
      status: "PAGO",
    });

    expect(resultado.tipo).toBe("ADUBO");
    expect(resultado.valor).toBe(100);
  });

  it("exige tipo personalizado quando tipo e OUTRO", () => {
    expect(() =>
      criarGastoSchema.parse({
        colheitaId: uuid,
        tipo: "OUTRO",
        valor: 50,
        data: "2026-05-01",
        status: "PENDENTE",
      }),
    ).toThrow();
  });

  it("normaliza query vazia para listagem", () => {
    const resultado = listarGastosQuerySchema.parse({});
    expect(resultado.page).toBe(1);
    expect(resultado.pageSize).toBe(20);
  });
});
