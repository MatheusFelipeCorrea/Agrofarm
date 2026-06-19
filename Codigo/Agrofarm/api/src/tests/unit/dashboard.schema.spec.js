import { describe, expect, it } from "vitest";
import { dashboardFiltroQuerySchema } from "../../schemas/dashboard.schema.js";

describe("dashboardFiltroQuerySchema", () => {
  it("aceita fazendaId como uuid", () => {
    const result = dashboardFiltroQuerySchema.parse({
      fazendaId: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result).toEqual({
      fazendaId: "550e8400-e29b-41d4-a716-446655440000",
    });
  });

  it("aceita fazendaId como todas", () => {
    const result = dashboardFiltroQuerySchema.parse({ fazendaId: "todas" });
    expect(result).toEqual({ fazendaId: "todas" });
  });

  it("rejeita fazendaId inválido", () => {
    expect(() => dashboardFiltroQuerySchema.parse({ fazendaId: "abc" })).toThrow(/fazendaId inválido/i);
  });
});