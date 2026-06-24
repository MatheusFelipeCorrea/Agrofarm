import { describe, expect, it } from "vitest";
import { app } from "../../app.js";

describe("app", () => {
  it("exporta instancia express configurada", () => {
    expect(app).toBeDefined();
    expect(typeof app).toBe("function");
    expect(app._router).toBeDefined();
  });

  it("registra middlewares e rotas da API", () => {
    const camadas = app._router.stack.map((layer) => layer.name);
    expect(camadas).toContain("router");
    expect(app._router.stack.some((layer) => layer.regexp?.test?.("/api"))).toBe(true);
  });
});
