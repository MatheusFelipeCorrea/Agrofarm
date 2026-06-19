import { describe, expect, it } from "vitest";
import axios from "axios";
import { getApiErrorMessage } from "./apiError.js";

describe("getApiErrorMessage", () => {
  it("retorna mensagem da API quando disponivel", () => {
    const error = {
      response: { data: { message: "Email já cadastrado" } },
    };
    expect(getApiErrorMessage(error)).toBe("Email já cadastrado");
  });

  it("concatena issues de validacao zod", () => {
    const error = {
      response: {
        data: {
          issues: [{ message: "Campo obrigatório" }, { message: "Email inválido" }],
        },
      },
    };
    expect(getApiErrorMessage(error)).toBe("Campo obrigatório Email inválido");
  });

  it("detecta erro de rede axios sem resposta", () => {
    const error = axios.AxiosError.from(
      new Error("Network Error"),
      "ERR_NETWORK",
      {},
      {},
      undefined,
    );
    expect(getApiErrorMessage(error)).toContain("contatar o servidor");
  });

  it("usa fallback quando nao ha detalhes", () => {
    expect(getApiErrorMessage({}, "Falha customizada")).toBe("Falha customizada");
  });
});
