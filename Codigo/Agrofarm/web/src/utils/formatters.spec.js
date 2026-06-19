import { describe, expect, it } from "vitest";
import {
  formatBRL,
  formatDate,
  formatDateBR,
  formatNumberPtBR,
  formatPhoneMasked,
  formatValorForInput,
  parseValorFromInput,
} from "./formatters.js";

describe("formatters", () => {
  it("formatBRL usa locale pt-BR", () => {
    expect(formatBRL(1234.5)).toContain("R$");
    expect(formatBRL("10")).toContain("10");
  });

  it("formatDate converte ISO para dd/mm/aaaa", () => {
    expect(formatDate("2026-05-16")).toBe("16/05/2026");
    expect(formatDate("")).toBe("");
  });

  it("parseValorFromInput interpreta formato brasileiro", () => {
    expect(parseValorFromInput("1.234,56")).toBe(1234.56);
    expect(parseValorFromInput("")).toBe(0);
  });

  it("formatValorForInput e formatNumberPtBR", () => {
    expect(formatValorForInput(1500)).toContain("1.500");
    expect(formatNumberPtBR(12.345, { maximumFractionDigits: 1 })).toBe("12,3");
    expect(formatNumberPtBR("x")).toBe("0");
  });

  it("formatDateBR e formatPhoneMasked com fallback", () => {
    expect(formatDateBR(null)).toBe("—");
    expect(formatPhoneMasked("31999998888")).toBe("(31)9xxxx-xxxx");
    expect(formatPhoneMasked(null)).toBe("—");
  });
});
