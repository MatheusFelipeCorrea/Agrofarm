import { verifyToken } from "../shared/utils/jwt.js";
import { AppError } from "../shared/errors/AppError.js";
import { authRepository } from "../repositories/auth.repository.js";

async function resolverUsuarioDaSessao(decoded) {
  if (!decoded?.id && !decoded?.email) return null;

  const porId = decoded.id ? await authRepository.buscarPorId(decoded.id) : null;
  if (porId) return porId;

  if (decoded.email) {
    return authRepository.buscarPorEmail(decoded.email);
  }

  return null;
}

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Token não fornecido", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    const usuarioDb = await resolverUsuarioDaSessao(decoded);

    if (!usuarioDb) {
      throw new AppError("Sessão inválida. Faça login novamente.", 401);
    }

    const tokenVersionJwt = decoded.tokenVersion ?? 0;
    const tokenVersionDb = usuarioDb.token_version ?? 0;

    if (tokenVersionJwt !== tokenVersionDb) {
      throw new AppError("Sessão inválida. Faça login novamente.", 401);
    }

    if (usuarioDb.must_change_password) {
      throw new AppError("E necessario definir uma nova senha antes de acessar o sistema", 403);
    }

    req.usuario = {
      id: usuarioDb.id,
      nome: usuarioDb.nome,
      email: usuarioDb.email,
      role: usuarioDb.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
