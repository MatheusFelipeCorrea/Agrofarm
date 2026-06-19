/**
 * Restringe entrada a número decimal ≥ 0: dígitos e no máximo um separador (`,` ou `.`).
 * Exibe vírgula como separador decimal (pt-BR), compatível com `Number(str.replace(",", "."))`.
 * @param {string} input
 * @param {{ maxFractionDigits?: number }} [opts]
 */
export function sanitizeNonNegativeDecimal(input, opts = {}) {
  const maxFD = opts.maxFractionDigits ?? 8;
  const raw = String(input ?? "");
  let intPart = "";
  let fracPart = "";
  let hasSep = false;

  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") {
      if (hasSep) {
        if (fracPart.length < maxFD) fracPart += ch;
      } else {
        intPart += ch;
      }
    } else if ((ch === "." || ch === ",") && !hasSep) {
      hasSep = true;
    }
  }

  if (!hasSep) return intPart;
  if (intPart === "" && fracPart === "") return "0,";
  if (intPart === "") return `0,${fracPart}`;
  return `${intPart},${fracPart}`;
}

/**
 * Apenas dígitos, limite opcional (ex.: telefone BR 10–11 sem DDI).
 * @param {string} input
 * @param {number} [maxLen]
 */
export function sanitizeDigits(input, maxLen = 15) {
  return String(input ?? "")
    .replace(/\D/g, "")
    .slice(0, maxLen);
}

/**
 * Cor hexadecimal `#RRGGBB` (permite digitação parcial).
 * @param {string} input
 */
export function sanitizeHexColor(input) {
  const raw = String(input ?? "").trim();
  if (raw === "") return "#";
  const body = (raw.startsWith("#") ? raw.slice(1) : raw).toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 6);
  return `#${body}`;
}

/**
 * Valor em pt-BR (pontos como milhar, vírgula para decimais), alinhado a `formatValorForInput` / `parseValorFromInput`.
 * @param {string} input
 * @param {{ maxFractionDigits?: number }} [opts]
 */
export function sanitizeBRLTypedInput(input, opts = {}) {
  const maxFD = opts.maxFractionDigits ?? 2;
  const s = String(input ?? "").replace(/[^\d.,]/g, "");
  const i = s.indexOf(",");
  if (i === -1) {
    return s.replace(/\.{2,}/g, ".").replace(/[^0-9.]/g, "");
  }
  const head = s
    .slice(0, i)
    .replace(/[^\d.]/g, "")
    .replace(/\.{2,}/g, ".");
  const tail = s.slice(i + 1).replace(/\D/g, "").slice(0, maxFD);
  return `${head},${tail}`;
}
