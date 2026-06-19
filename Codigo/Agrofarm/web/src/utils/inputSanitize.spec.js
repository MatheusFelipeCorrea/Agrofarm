import { describe, expect, it } from "vitest";
import {
  sanitizeBRLTypedInput,
  sanitizeDigits,
  sanitizeHexColor,
  sanitizeNonNegativeDecimal,
} from "./inputSanitize.js";

describe("inputSanitize", () => {
  it("sanitizeNonNegativeDecimal aceita virgula e limita decimais", () => {
    expect(sanitizeNonNegativeDecimal("12,3456", { maxFractionDigits: 2 })).toBe("12,34");
    expect(sanitizeNonNegativeDecimal("abc12,3")).toBe("12,3");
  });

  it("sanitizeDigits remove nao numericos e respeita limite", () => {
    expect(sanitizeDigits("(31) 99999-8888", 11)).toBe("31999998888");
  });

  it("sanitizeHexColor normaliza cor parcial", () => {
    expect(sanitizeHexColor("2e5b")).toBe("#2E5B");
    expect(sanitizeHexColor("")).toBe("#");
  });

  it("sanitizeBRLTypedInput separa milhar e centavos", () => {
    expect(sanitizeBRLTypedInput("1.234,56")).toBe("1.234,56");
    expect(sanitizeBRLTypedInput("10,999", { maxFractionDigits: 2 })).toBe("10,99");
  });
});
