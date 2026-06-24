import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppError } from "../../shared/errors/AppError.js";

vi.mock("../../shared/utils/jwt.js", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("../../repositories/auth.repository.js", () => ({
  authRepository: {
    buscarPorId: vi.fn(),
    buscarPorEmail: vi.fn(),
  },
}));

import { verifyToken } from "../../shared/utils/jwt.js";
import { authRepository } from "../../repositories/auth.repository.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

function mockReqRes(token = "Bearer abc") {
  const req = { headers: { authorization: token } };
  const res = {};
  const next = vi.fn();
  return { req, res, next };
}

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita quando token ausente", async () => {
    const { req, next } = mockReqRes("");
    req.headers.authorization = undefined;
    await authMiddleware(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it("usa usuario do banco pelo id do token", async () => {
    verifyToken.mockReturnValue({ id: "u1", email: "a@b.com", tokenVersion: 1 });
    authRepository.buscarPorId.mockResolvedValue({
      id: "u1",
      nome: "Admin",
      email: "a@b.com",
      role: "ADMIN",
      token_version: 1,
      must_change_password: false,
    });

    const { req, next } = mockReqRes();
    await authMiddleware(req, {}, next);

    expect(req.usuario).toEqual({ id: "u1", nome: "Admin", email: "a@b.com", role: "ADMIN" });
    expect(next).toHaveBeenCalledWith();
  });

  it("rejeita token com versao desatualizada", async () => {
    verifyToken.mockReturnValue({ id: "u1", email: "a@b.com", tokenVersion: 0 });
    authRepository.buscarPorId.mockResolvedValue({
      id: "u1",
      nome: "Admin",
      email: "a@b.com",
      role: "ADMIN",
      token_version: 2,
      must_change_password: false,
    });

    const { req, next } = mockReqRes();
    await authMiddleware(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it("resolve usuario pelo email quando id do token ficou obsoleto apos reseed", async () => {
    verifyToken.mockReturnValue({ id: "id-antigo", email: "admin@test.com", tokenVersion: 0 });
    authRepository.buscarPorId.mockResolvedValue(null);
    authRepository.buscarPorEmail.mockResolvedValue({
      id: "id-novo",
      nome: "Admin",
      email: "admin@test.com",
      role: "ADMIN",
      token_version: 0,
      must_change_password: false,
    });

    const { req, next } = mockReqRes();
    await authMiddleware(req, {}, next);

    expect(req.usuario.id).toBe("id-novo");
    expect(next).toHaveBeenCalledWith();
  });
});
