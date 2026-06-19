import { describe, expect, it } from "vitest";
import { createLucroSchema, lucroFiltroSchema, updateLucroSchema } from "../../schemas/lucro.schema.js";

const uuid = "550e8400-e29b-41d4-a716-446655440000";

describe("lucro.schema", () => {
  it("aceita criacao valida", () => {
    const resultado = createLucroSchema.parse({
      colheitaId: uuid,
      quantidadeSacas: 10,
      valorUnitario: 150,
      comprador: "Cooperativa",
      data: "2026-05-01",
    });
    expect(resultado.quantidadeSacas).toBe(10);
  });

  it("update exige ao menos um campo", () => {
    expect(() => updateLucroSchema.parse({})).toThrow();
  });

  it("filtro rejeita from maior que to", () => {
    expect(() =>
      lucroFiltroSchema.parse({
        from: "2026-05-10",
        to: "2026-05-01",
      }),
    ).toThrow();
  });
});
