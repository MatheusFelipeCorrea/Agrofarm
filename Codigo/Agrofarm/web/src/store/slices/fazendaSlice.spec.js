import { describe, expect, it } from "vitest";
import {
  createFazendaSlice,
  FAZENDA_TODAS_VALUE,
  normalizarFazendaSelecionada,
} from "./fazendaSlice.js";

describe("fazendaSlice", () => {
  it("normaliza valor vazio para 'todas'", () => {
    expect(normalizarFazendaSelecionada("")).toBe(FAZENDA_TODAS_VALUE);
    expect(normalizarFazendaSelecionada("   ")).toBe(FAZENDA_TODAS_VALUE);
    expect(normalizarFazendaSelecionada(null)).toBe(FAZENDA_TODAS_VALUE);
  });

  it("mantém id válido de fazenda", () => {
    expect(normalizarFazendaSelecionada("faz-123")).toBe("faz-123");
  });

  it("atualiza estado via setFazendaSelecionada e resetFazendaSelecionada", () => {
    let state = {};

    const set = (next) => {
      const patch = typeof next === "function" ? next(state) : next;
      state = { ...state, ...patch };
    };

    state = { ...state, ...createFazendaSlice(set) };

    expect(state.fazendaSelecionada).toBe(FAZENDA_TODAS_VALUE);

    state.setFazendaSelecionada("faz-999");
    expect(state.fazendaSelecionada).toBe("faz-999");

    state.resetFazendaSelecionada();
    expect(state.fazendaSelecionada).toBe(FAZENDA_TODAS_VALUE);
  });
});
