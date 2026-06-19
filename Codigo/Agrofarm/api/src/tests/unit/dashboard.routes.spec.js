import { describe, expect, it } from "vitest";
import { dashboardRoutes } from "../../routes/dashboard.routes.js";

describe("dashboardRoutes", () => {
  it("registra auth middleware no router", () => {
    expect(dashboardRoutes.stack.some((layer) => layer.name === "authMiddleware")).toBe(true);
  });

  it("registra GET /", () => {
    const routeLayer = dashboardRoutes.stack.find((layer) => layer.route?.path === "/");

    expect(routeLayer).toBeTruthy();
    expect(routeLayer.route.methods.get).toBe(true);
  });
});