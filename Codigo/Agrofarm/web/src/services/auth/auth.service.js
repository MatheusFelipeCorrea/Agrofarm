import axios from "axios";
import { api } from "../api.js";

export function normalizeSessionPayload(data) {
  return {
    token: data?.token ?? null,
    usuario: data?.usuario ?? null,
    menu: Array.isArray(data?.menu) ? data.menu : [],
  };
}

export class PasswordChangeRequiredError extends Error {
  constructor(userId) {
    super("PASSWORD_CHANGE_REQUIRED");
    this.name = "PasswordChangeRequiredError";
    this.userId = userId;
  }
}

export async function login({ email, senha }) {
  try {
    const { data } = await api.post("/auth/login", { email, senha });
    return normalizeSessionPayload(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      const body = error.response.data;
      if (body?.requirePasswordChange && body?.userId) {
        throw new PasswordChangeRequiredError(body.userId);
      }
    }
    throw error;
  }
}

export async function changeInitialPassword({ userId, oldPassword, newPassword, confirmNewPassword }) {
  const { data } = await api.post("/auth/change-initial-password", {
    userId,
    oldPassword,
    newPassword,
    confirmNewPassword,
  });
  return normalizeSessionPayload(data);
}

export async function cadastroUsuario({ nome, email, role, telefone, fazendaIds }) {
  const { data } = await api.post("/auth/cadastro", {
    nome,
    email,
    role,
    telefone,
    fazendaIds,
  });
  return data;
}

export async function obterSessaoAtual() {
  const { data } = await api.get("/auth/me");
  return normalizeSessionPayload(data);
}

export async function logout() {
  const { data } = await api.post("/auth/logout");
  return data;
}

export async function esqueciSenha({ email }) {
  const { data } = await api.post("/auth/esqueci-senha", { email });
  return data;
}

export async function redefinirSenha({ token, novaSenha }) {
  const { data } = await api.post("/auth/redefinir-senha", { token, novaSenha });
  return data;
}
