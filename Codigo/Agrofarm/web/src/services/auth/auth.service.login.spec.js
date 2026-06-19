import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api.js", () => ({
  api: {
    post: vi.fn(),
  },
}));

const { api } = await import("../api.js");
const { login, PasswordChangeRequiredError } = await import("./auth.service.js");

describe("auth.service login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna sessao normalizada no login", async () => {
    api.post.mockResolvedValue({
      data: {
        token: "jwt",
        usuario: { id: "u1", role: "ADMIN" },
        menu: [{ id: "dashboard", path: "/" }],
      },
    });

    const sessao = await login({ email: "admin@agrofarm.com", senha: "123456" });

    expect(sessao.token).toBe("jwt");
    expect(sessao.menu).toHaveLength(1);
  });

  it("lança PasswordChangeRequiredError no 403 de troca obrigatoria", async () => {
    api.post.mockRejectedValue(
      new axios.AxiosError("Forbidden", "ERR_BAD_REQUEST", {}, {}, {
        status: 403,
        data: { requirePasswordChange: true, userId: "u-pw" },
      }),
    );

    await expect(login({ email: "novo@agrofarm.com", senha: "Senha123456" })).rejects.toBeInstanceOf(
      PasswordChangeRequiredError,
    );
  });
});
