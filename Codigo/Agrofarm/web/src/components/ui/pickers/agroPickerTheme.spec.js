import { describe, expect, it } from "vitest";
import {
  formatDateLabel,
  formatTimeLabel,
  parseIsoDate,
  parseTimeValue,
} from "./agroPickerTheme.js";

describe("agroPickerTheme helpers", () => {
  it("formatDateLabel converte ISO para dd/mm/aaaa", () => {
    expect(formatDateLabel("2026-05-16")).toBe("16/05/2026");
    expect(formatDateLabel("")).toBe("Selecione a data");
  });

  it("parseIsoDate retorna Date valida ou undefined", () => {
    expect(parseIsoDate("2026-05-16")).toBeInstanceOf(Date);
    expect(parseIsoDate("invalido")).toBeUndefined();
  });

  it("formatTimeLabel e parseTimeValue", () => {
    expect(formatTimeLabel("14:30")).toBe("14:30");
    expect(parseTimeValue("08:15")).toEqual({ hour: "08", minute: "15" });
    expect(parseTimeValue("x")).toEqual({ hour: "09", minute: "00" });
  });
});
