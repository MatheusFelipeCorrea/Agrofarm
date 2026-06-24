import { describe, expect, it } from "vitest";
import { getFirstAllowedPath, isAuthPublicPath, isPathAllowed } from "./routeAccess.js";

describe("ProtectedRoute helpers", () => {
  it("retorna a primeira rota permitida priorizando path do item raiz", () => {
    const menu = [
      {
        id: "dashboard",
        path: "/",
        children: [],
      },
      {
        id: "fazendas",
        path: null,
        children: [{ id: "gerenciar-fazendas", path: "/fazendas" }],
      },
    ];

    expect(getFirstAllowedPath(menu)).toBe("/");
  });

  it("retorna path do primeiro filho quando o item raiz nao possui rota", () => {
    const menu = [
      {
        id: "fazendas",
        path: null,
        children: [{ id: "gerenciar-fazendas", path: "/fazendas" }],
      },
    ];

    expect(getFirstAllowedPath(menu)).toBe("/fazendas");
  });

  it("retorna / quando menu invalido ou vazio", () => {
    expect(getFirstAllowedPath()).toBe("/");
    expect(getFirstAllowedPath([])).toBe("/");
  });

  it("permite apenas insumos para menu de funcionario", () => {
    const menu = [{ id: "gerenciar-insumos-funcionario", path: "/insumos", children: [] }];

    expect(getFirstAllowedPath(menu)).toBe("/insumos");
    expect(isPathAllowed("/insumos", menu)).toBe(true);
    expect(isPathAllowed("/", menu)).toBe(false);
    expect(isPathAllowed("/fazendas", menu)).toBe(false);
    expect(isPathAllowed("/gastos", menu)).toBe(false);
  });

  it("permite alterar senha para qualquer usuario autenticado", () => {
    const menu = [{ id: "gerenciar-insumos-funcionario", path: "/insumos", children: [] }];

    expect(isPathAllowed("/alterar-senha", menu)).toBe(true);
  });

  it("identifica corretamente rotas publicas de autenticacao", () => {
    expect(isAuthPublicPath("/login")).toBe(true);
    expect(isAuthPublicPath("/recuperar-senha")).toBe(true);
    expect(isAuthPublicPath("/redefinir-senha")).toBe(true);
    expect(isAuthPublicPath("/")).toBe(false);
    expect(isAuthPublicPath("/fazendas")).toBe(false);
  });
});
