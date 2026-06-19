import { describe, expect, it } from "vitest";
import {
  FAZENDA_TODAS_VALUE,
  normalizarFazendaSelecionada,
} from "./store/slices/fazendaSlice.js";

describe("Integração leve — rota principal e persistência de fazenda", () => {
  it("fazendaSlice retorna 'todas' como valor padrão", () => {
    expect(FAZENDA_TODAS_VALUE).toBe("todas");
  });

  it("normalizarFazendaSelecionada preserva id de fazenda válido", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(normalizarFazendaSelecionada(id)).toBe(id);
  });

  it("normalizarFazendaSelecionada volta para 'todas' quando valor é inválido", () => {
    expect(normalizarFazendaSelecionada("")).toBe("todas");
    expect(normalizarFazendaSelecionada(undefined)).toBe("todas");
    expect(normalizarFazendaSelecionada(42)).toBe("todas");
  });
});
