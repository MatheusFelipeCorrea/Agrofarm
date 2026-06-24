import { describe, expect, it } from "vitest";
import {
  isAuthPublicPath,
  collectAllowedPaths,
  isPathAllowed,
  getFirstAllowedPath,
} from "./routeAccess.js";

const menu = [
  { path: "/dashboard", children: [] },
  {
    path: null,
    children: [
      { path: "/fazendas" },
      { path: "/gastos" },
    ],
  },
];

describe("routeAccess", () => {
  it("isAuthPublicPath identifica rotas públicas de autenticação", () => {
    expect(isAuthPublicPath("/login")).toBe(true);
    expect(isAuthPublicPath("/recuperar-senha")).toBe(true);
    expect(isAuthPublicPath("/redefinir-senha")).toBe(true);
    expect(isAuthPublicPath("/trocar-senha-inicial")).toBe(true);
    expect(isAuthPublicPath("/dashboard")).toBe(false);
  });

  it("collectAllowedPaths extrai paths de itens e filhos", () => {
    expect(collectAllowedPaths(menu)).toEqual(["/dashboard", "/fazendas", "/gastos"]);
    expect(collectAllowedPaths(null)).toEqual([]);
  });

  it("isPathAllowed permite /alterar-senha sempre", () => {
    expect(isPathAllowed("/alterar-senha", [])).toBe(true);
  });

  it("isPathAllowed nega quando menu não tem paths", () => {
    expect(isPathAllowed("/fazendas", [])).toBe(false);
  });

  it("isPathAllowed aceita path exato e subrotas", () => {
    expect(isPathAllowed("/fazendas", menu)).toBe(true);
    expect(isPathAllowed("/fazendas/123", menu)).toBe(true);
    expect(isPathAllowed("/fazendas/", menu)).toBe(true);
    expect(isPathAllowed("/lucros", menu)).toBe(false);
  });

  it("isPathAllowed trata raiz corretamente", () => {
    const menuRaiz = [{ path: "/", children: [] }];
    expect(isPathAllowed("/", menuRaiz)).toBe(true);
    expect(isPathAllowed("/outro", menuRaiz)).toBe(false);
  });

  it("getFirstAllowedPath retorna primeiro path do menu", () => {
    expect(getFirstAllowedPath(menu)).toBe("/dashboard");
  });

  it("getFirstAllowedPath retorna path do primeiro filho quando item não tem path", () => {
    const menuSemPai = [{ children: [{ path: "/gastos" }] }];
    expect(getFirstAllowedPath(menuSemPai)).toBe("/gastos");
  });

  it("getFirstAllowedPath retorna / para menu vazio", () => {
    expect(getFirstAllowedPath([])).toBe("/");
    expect(getFirstAllowedPath(null)).toBe("/");
  });
});
