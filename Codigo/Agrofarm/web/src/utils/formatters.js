export function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

/* Número com separador de milhar (pt-BR) */
export function formatNumberPtBR(value, { maximumFractionDigits = 2 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(n);
}

export function formatDate(iso) {
  if (!iso) return "";
  const [year, month, day] = String(iso).split("-");
  if (!year || !month || !day) return String(iso);
  return `${day}/${month}/${year}`;
}

export function formatValorForInput(num) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(num) || 0);
}

export function parseValorFromInput(raw) {
  const normalized = String(raw).trim().replace(/\./g, "").replace(",", ".");
  return Number.parseFloat(normalized) || 0;
}

/** exibe DD/MM/AAAA como no layout de usuarios */
export function formatDateBR(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const ymd = String(iso).slice(0, 10);
    return formatDate(ymd) || "—";
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** exibe telefone no padrão da tabela: (DD)9xxxx-xxxx */
export function formatPhoneMasked(telefone) {
  if (!telefone) return "—";
  const digits = telefone.replace(/\D/g, "");
  if (digits.length >= 10) {
    const ddd = digits.slice(0, 2);
    return `(${ddd})9xxxx-xxxx`;
  }
  return telefone;
}

/** exibe data e hora: DD/MM/AAAA HH:MM */
export function formatarData(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  const data = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${data} ${hora}`;
}

