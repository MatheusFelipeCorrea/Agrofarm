export const USUARIOS_COL_WIDTHS_PCT = [18, 20, 14, 12, 14, 11, 11];

export const USUARIOS_TABLE_HEADERS = ["Nome", "Email", "Telefone", "Criado em", "Tipo", "Status", "Ações"];

export const USER_ROLES = {
  ADMIN: "ADMIN",
  FUNCIONARIO: "FUNCIONARIO",
};

export function roleLabel(role) {
  if (role === USER_ROLES.ADMIN) return "Administrador";
  if (role === USER_ROLES.FUNCIONARIO) return "Funcionário";
  return String(role ?? "");
}
