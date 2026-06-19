import { api } from "../api.js";

export async function listarUsuarios() {
  const { data } = await api.get("/usuarios");
  return data.usuarios;
}

export async function buscarUsuario(id) {
  const { data } = await api.get(`/usuarios/${id}`);
  return data.usuario;
}

export async function atualizarUsuario(id, payload) {
  const { data } = await api.put(`/usuarios/${id}`, payload);
  return data.usuario;
}

export async function excluirUsuario(id) {
  await api.delete(`/usuarios/${id}`);
}
