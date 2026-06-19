import { describe, expect, it } from "vitest";
import {
  cadastroSchema,
  changeInitialPasswordSchema,
  loginSchema,
} from "../../schemas/auth.schema.js";

const fazendaId = "550e8400-e29b-41d4-a716-446655440000";
const userId = "660e8400-e29b-41d4-a716-446655440001";

describe("auth.schema", () => {
  it("valida login com email e senha", () => {
    const resultado = loginSchema.parse({
      email: "user@agrofarm.com",
      senha: "123456",
    });
    expect(resultado.email).toBe("user@agrofarm.com");
  });

  it("exige fazenda para funcionario no cadastro", () => {
    expect(() =>
      cadastroSchema.parse({
        nome: "Func",
        email: "func@agrofarm.com",
        role: "FUNCIONARIO",
        fazendaIds: [],
      }),
    ).toThrow();
  });

  it("aceita cadastro de funcionario com fazendas", () => {
    const resultado = cadastroSchema.parse({
      nome: "Func",
      email: "func@agrofarm.com",
      role: "FUNCIONARIO",
      fazendaIds: [fazendaId],
    });
    expect(resultado.fazendaIds).toEqual([fazendaId]);
  });

  it("valida troca de senha inicial com confirmacao igual", () => {
    const resultado = changeInitialPasswordSchema.parse({
      userId,
      oldPassword: "Senha123456",
      newPassword: "NovaSenha1",
      confirmNewPassword: "NovaSenha1",
    });
    expect(resultado.newPassword).toBe("NovaSenha1");
  });

  it("rejeita confirmacao diferente na troca inicial", () => {
    expect(() =>
      changeInitialPasswordSchema.parse({
        userId,
        oldPassword: "Senha123456",
        newPassword: "NovaSenha1",
        confirmNewPassword: "OutraSenha",
      }),
    ).toThrow();
  });
});
