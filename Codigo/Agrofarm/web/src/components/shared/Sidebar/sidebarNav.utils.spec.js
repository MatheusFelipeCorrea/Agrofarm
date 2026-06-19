import { describe, expect, it } from "vitest";
import { getDefaultExpandedGroupIds, hasActiveChild, isPathActive } from "./sidebarNav.utils.js";

describe("sidebarNav.utils", () => {
  it("detecta item ativo por path exato e por subrota", () => {
    expect(isPathActive("/", "/")).toBe(true);
    expect(isPathActive("/fazendas", "/fazendas")).toBe(true);
    expect(isPathActive("/fazendas/123", "/fazendas")).toBe(true);
    expect(isPathActive("/gastos", "/fazendas")).toBe(false);
  });

  it("detecta filho ativo em grupo de menu", () => {
    const item = {
      id: "fazendas",
      children: [
        { id: "f1", path: "/fazendas" },
        { id: "f2", path: "/gastos" },
      ],
    };

    expect(hasActiveChild("/gastos", item)).toBe(true);
    expect(hasActiveChild("/lucros", item)).toBe(false);
  });

  it("retorna ids de grupos que devem iniciar expandidos para a rota atual", () => {
    const menu = [
      {
        id: "dashboard",
        path: "/",
        children: [],
      },
      {
        id: "fazendas",
        path: null,
        children: [
          { id: "gerenciar-fazendas", path: "/fazendas" },
          { id: "gerenciar-gastos", path: "/gastos" },
        ],
      },
    ];

    expect(getDefaultExpandedGroupIds(menu, "/gastos")).toEqual(["fazendas"]);
    expect(getDefaultExpandedGroupIds(menu, "/usuarios")).toEqual([]);
  });
});
