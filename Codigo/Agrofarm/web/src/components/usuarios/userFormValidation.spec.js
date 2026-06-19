import { describe, expect, it } from "vitest";
import { validateUsuarioFormForSubmit } from "./userFormValidation.js";

describe("validateUsuarioFormForSubmit", () => {
  it("exige ao menos uma fazenda para FUNCIONARIO no create", () => {
    const result = validateUsuarioFormForSubmit(
      {
        nome: "Funcionario",
        email: "func@agrofarm.com",
        role: "FUNCIONARIO",
        telefone: "31999999999",
        fazendaIds: [],
      },
      "create",
    );

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ message: "Funcionário deve possuir ao menos uma fazenda vinculada." });
  });

  it("monta payload create unico com telefone e fazendaIds", () => {
    const result = validateUsuarioFormForSubmit(
      {
        nome: "Funcionario",
        email: "func@agrofarm.com",
        role: "FUNCIONARIO",
        telefone: "31999999999",
        fazendaIds: ["faz-1", "faz-1", "faz-2"],
      },
      "create",
    );

    expect(result.ok).toBe(true);
    expect(result.create).toEqual({
      nome: "Funcionario",
      email: "func@agrofarm.com",
      role: "FUNCIONARIO",
      telefone: "31999999999",
      fazendaIds: ["faz-1", "faz-2"],
    });
  });

  it("envia resetPasswordToDefault no update quando marcado", () => {
    const result = validateUsuarioFormForSubmit(
      {
        nome: "Funcionario",
        email: "func@agrofarm.com",
        role: "FUNCIONARIO",
        telefone: "31999999999",
        fazendaIds: ["faz-1"],
        resetPasswordToDefault: true,
      },
      "edit",
      "user-2",
    );

    expect(result.ok).toBe(true);
    expect(result.update?.payload).toEqual({
      nome: "Funcionario",
      email: "func@agrofarm.com",
      telefone: "31999999999",
      role: "FUNCIONARIO",
      fazendaIds: ["faz-1"],
      resetPasswordToDefault: true,
    });
  });

  it("permite editar funcionario apenas marcando reset de senha", () => {
    const result = validateUsuarioFormForSubmit(
      {
        nome: "Funcionario",
        email: "func@agrofarm.com",
        role: "FUNCIONARIO",
        telefone: "",
        fazendaIds: ["faz-1"],
        resetPasswordToDefault: true,
      },
      "edit",
      "user-func",
    );

    expect(result.ok).toBe(true);
    expect(result.update?.payload).toEqual({
      nome: "Funcionario",
      email: "func@agrofarm.com",
      role: "FUNCIONARIO",
      fazendaIds: ["faz-1"],
      resetPasswordToDefault: true,
    });
  });

  it("permite ADMIN sem fazenda e inclui fazendaIds no update", () => {
    const result = validateUsuarioFormForSubmit(
      {
        nome: "Admin",
        email: "admin@agrofarm.com",
        role: "ADMIN",
        telefone: "",
        fazendaIds: [],
      },
      "edit",
      "user-1",
    );

    expect(result.ok).toBe(true);
    expect(result.update).toEqual({
      id: "user-1",
      payload: {
        nome: "Admin",
        email: "admin@agrofarm.com",
        role: "ADMIN",
        fazendaIds: [],
      },
    });
  });
});
