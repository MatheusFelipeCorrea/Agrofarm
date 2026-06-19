/**
 * @typedef {{ nome: string, email: string, role: string, telefone: string, fazendaIds?: string[], resetPasswordToDefault?: boolean }} UsuarioFormDraft
 */

/**
 * @param {UsuarioFormDraft} form
 * @param {"create" | "edit"} mode
 * @param {string | undefined} editUserId
 * @returns {{ ok: true, create?: object, update?: { id: string, payload: object } } | { ok: false, message: string }}
 */
export function validateUsuarioFormForSubmit(form, mode, editUserId) {
  const nome = form.nome?.trim() ?? "";
  const email = form.email?.trim() ?? "";
  const role = form.role?.trim() ?? "";
  const telefone = form.telefone?.trim() ?? "";
  const fazendaIds = Array.isArray(form.fazendaIds) ? [...new Set(form.fazendaIds)] : [];

  if (!nome || !email || !role) {
    return { ok: false, message: "Preencha nome, e-mail e tipo de usuário." };
  }

  if (role === "FUNCIONARIO" && fazendaIds.length < 1) {
    return { ok: false, message: "Funcionário deve possuir ao menos uma fazenda vinculada." };
  }

  if (mode === "create") {
    return {
      ok: true,
      create: {
        nome,
        email,
        role,
        telefone: telefone || undefined,
        fazendaIds,
      },
    };
  }

  if (!editUserId) {
    return { ok: false, message: "Não foi possível identificar o usuário a editar." };
  }

  /** @type {Record<string, unknown>} */
  const payload = { nome, email, role, fazendaIds };

  if (telefone) {
    payload.telefone = telefone;
  }

  if (form.resetPasswordToDefault) {
    payload.resetPasswordToDefault = true;
  }

  return { ok: true, update: { id: editUserId, payload } };
}
