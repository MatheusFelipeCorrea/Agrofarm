import { describe, expect, it } from "vitest";
import { normalizeSessionPayload } from "./auth.service.js";

describe("auth.service normalizeSessionPayload", () => {
  it("normaliza payload valido de sessao", () => {
    const payload = normalizeSessionPayload({
      token: "jwt-token",
      usuario: { id: "u-1", role: "ADMIN" },
      menu: [{ id: "dashboard", path: "/", children: [] }],
    });

    expect(payload).toEqual({
      token: "jwt-token",
      usuario: { id: "u-1", role: "ADMIN" },
      menu: [{ id: "dashboard", path: "/", children: [] }],
    });
  });

  it("aplica defaults seguros quando payload vem incompleto", () => {
    expect(normalizeSessionPayload(null)).toEqual({
      token: null,
      usuario: null,
      menu: [],
    });

    expect(
      normalizeSessionPayload({
        token: undefined,
        usuario: undefined,
        menu: "invalido",
      }),
    ).toEqual({
      token: null,
      usuario: null,
      menu: [],
    });
  });
});
