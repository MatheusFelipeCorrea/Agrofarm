import { describe, expect, it } from "vitest";
import { cotacaoRoutes } from "../../routes/cotacao.routes.js";

describe("cotacaoRoutes", () => {
  it("registra auth middleware no router", () => {
    expect(cotacaoRoutes.stack.some((layer) => layer.name === "authMiddleware")).toBe(true);
  });

  it("registra GET /dolar", () => {
    const routeLayer = cotacaoRoutes.stack.find((layer) => layer.route?.path === "/dolar");

    expect(routeLayer).toBeTruthy();
    expect(routeLayer.route.methods.get).toBe(true);
  });
});