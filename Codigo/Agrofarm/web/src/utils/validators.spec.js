import { describe, expect, it } from "vitest";
import { loginSchema } from "./validators.js";

describe("validators loginSchema", () => {
  it("aceita email e senha validos", () => {
    const resultado = loginSchema.parse({ email: "a@b.com", senha: "123456" });
    expect(resultado.email).toBe("a@b.com");
  });

  it("rejeita senha curta", () => {
    expect(() => loginSchema.parse({ email: "a@b.com", senha: "123" })).toThrow();
  });
});
