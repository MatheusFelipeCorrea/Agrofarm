import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const { api } = await import("../api.js");
const {
  cadastroUsuario,
  changeInitialPassword,
  esqueciSenha,
  logout,
  obterSessaoAtual,
  redefinirSenha,
} = await import("./auth.service.js");

describe("auth.service demais endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.post.mockResolvedValue({ data: { ok: true } });
    api.get.mockResolvedValue({
      data: { token: "jwt", usuario: { id: "u1" }, menu: [] },
    });
  });

  it("changeInitialPassword e cadastroUsuario", async () => {
    await changeInitialPassword({
      userId: "u1",
      oldPassword: "Senha123456",
      newPassword: "NovaSenha8",
      confirmNewPassword: "NovaSenha8",
    });
    await cadastroUsuario({
      nome: "Func",
      email: "f@b.com",
      role: "FUNCIONARIO",
      telefone: "31999999999",
      fazendaIds: ["f1"],
    });

    expect(api.post).toHaveBeenCalledWith("/auth/change-initial-password", expect.any(Object));
    expect(api.post).toHaveBeenCalledWith("/auth/cadastro", expect.objectContaining({ email: "f@b.com" }));
  });

  it("obterSessaoAtual, logout, esqueciSenha e redefinirSenha", async () => {
    const sessao = await obterSessaoAtual();
    await logout();
    await esqueciSenha({ email: "a@b.com" });
    await redefinirSenha({ token: "tok", novaSenha: "12345678" });

    expect(sessao.token).toBe("jwt");
    expect(api.get).toHaveBeenCalledWith("/auth/me");
    expect(api.post).toHaveBeenCalledWith("/auth/logout");
    expect(api.post).toHaveBeenCalledWith("/auth/esqueci-senha", { email: "a@b.com" });
    expect(api.post).toHaveBeenCalledWith("/auth/redefinir-senha", { token: "tok", novaSenha: "12345678" });
  });
});
