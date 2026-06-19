
export const BADGE_BASE =
  "inline-flex max-w-full items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold leading-snug ring-1 ring-inset";

export const BADGE_TONES = {
  emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
  green: "bg-green-50 text-green-800 ring-green-200/80",
  sky: "bg-sky-50 text-sky-800 ring-sky-200/80",
  yellow: "bg-yellow-50 text-yellow-900 ring-yellow-300/90",
  amber: "bg-amber-50 text-amber-800 ring-amber-200/80",
  orange: "bg-orange-50 text-orange-900 ring-orange-200/80",
  red: "bg-red-50 text-red-800 ring-red-200/80",
  gray: "bg-gray-100 text-gray-600 ring-gray-200/90",
  violet: "bg-violet-50 text-violet-800 ring-violet-200/80",
  teal: "bg-teal-50 text-teal-800 ring-teal-200/80",
};

export function toneClass(tone) {
  return BADGE_TONES[tone] ?? BADGE_TONES.gray;
}

export const BADGE_TONES_VIVID = {
  orange: "bg-orange-500 text-white ring-orange-600/45",
  yellow: "bg-yellow-400 text-yellow-950 ring-yellow-500/55",
  sky: "bg-blue-600 text-white ring-blue-700/45",
  gray: "bg-gray-600 text-white ring-gray-700/45",
};

export function toneClassVivid(tone) {
  return BADGE_TONES_VIVID[tone] ?? BADGE_TONES_VIVID.gray;
}

export function mergeBadgeClass(tone, extra = "") {
  return [BADGE_BASE, toneClass(tone), extra].filter(Boolean).join(" ");
}

function parseHex(hex) {
  const raw = String(hex ?? "#6b7280").replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return { r: 107, g: 114, b: 128 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function relativeLuminance(r, g, b) {
  const toLinear = (c) => {
    const n = c / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  const [rs, gs, bs] = [r, g, b].map(toLinear);
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getCulturaBadgeStyles(hex) {
  const { r, g, b } = parseHex(hex);
  const textR = Math.max(0, Math.min(255, Math.round(r * 0.32)));
  const textG = Math.max(0, Math.min(255, Math.round(g * 0.32)));
  const textB = Math.max(0, Math.min(255, Math.round(b * 0.32)));
  const dotR = Math.max(0, Math.min(255, Math.round(r * 0.78)));
  const dotG = Math.max(0, Math.min(255, Math.round(g * 0.78)));
  const dotB = Math.max(0, Math.min(255, Math.round(b * 0.78)));
  return {
    className: `${BADGE_BASE} gap-1.5`,
    style: {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.2)`,
      color: `rgb(${textR}, ${textG}, ${textB})`,
      boxShadow: `inset 0 0 0 1px rgba(${r}, ${g}, ${b}, 0.42)`,
    },
    dotColor: `rgb(${dotR}, ${dotG}, ${dotB})`,
  };
}

/** Badge de cultura com cor plena do banco (Fazendas). */
export function getCulturaBadgeStylesVivid(hex) {
  const { r, g, b } = parseHex(hex);
  const lum = relativeLuminance(r, g, b);
  const lightText = lum <= 0.45;
  return {
    className: `${BADGE_BASE} gap-1.5 font-semibold`,
    style: {
      backgroundColor: `rgb(${r}, ${g}, ${b})`,
      color: lightText ? "#ffffff" : "#1a1a1a",
      boxShadow: lightText ? "inset 0 0 0 1px rgba(255,255,255,0.25)" : "inset 0 0 0 1px rgba(0,0,0,0.12)",
    },
    dotColor: lightText ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.35)",
  };
}

/** Própria = laranja | Arrendada = amarelo | Arrendada p/ terceiros = azul */
export const FAZENDA_TIPO_TONE = {
  PROPRIA: "orange",
  ARRENDADA_DE_TERCEIROS: "yellow",
  ARRENDADA_PARA_TERCEIROS: "sky",
};

/** Mesmas regras de FAZENDA_TIPO_TONE, com classes saturadas. */
export const FAZENDA_TIPO_TONE_VIVID = FAZENDA_TIPO_TONE;

export const FAZENDA_TIPO_BADGE_CLASS = {
  PROPRIA: "bg-indigo-900 text-indigo-50 ring-indigo-950/35",
  ARRENDADA_DE_TERCEIROS: "bg-yellow-400 text-yellow-950 ring-yellow-500/55",
  ARRENDADA_PARA_TERCEIROS: "bg-slate-700 text-slate-100 ring-slate-800/40",
};

export function fazendaTipoBadgeClass(tipo) {
  return FAZENDA_TIPO_BADGE_CLASS[tipo] ?? BADGE_TONES_VIVID.gray;
}

/** Ativa = verde | Inativa = vermelho */
export const FAZENDA_ATIVA_TONE = {
  ativa: "green",
  inativa: "red",
};

export const CULTURA_STATUS_TONE = {
  COLHEITA: "emerald",
  PLANTIO: "sky",
  SECAGEM: "amber",
  ADUBACAO: "violet",
  PULVERIZACAO: "teal",
};

export const LEMBRETE_STATUS_TONE = {
  PENDENTE: { label: "Pendente", tone: "amber" },
  ENVIADO: { label: "Em andamento", tone: "sky" },
  CANCELADO: { label: "Cancelada", tone: "gray" },
};

export const LUCRO_RECEBIMENTO_TONE = {
  PENDENTE: { label: "Pendente", tone: "amber" },
  RECEBIDO: { label: "Recebido", tone: "emerald" },
  NAO_RECEBIDO: { label: "Não recebido", tone: "red" },
};

export const LUCRO_SITUACAO_VENDA = { label: "Venda", tone: "emerald" };

export const LUCRO_SITUACAO_ATRASADO = { label: "Atrasado", tone: "red" };

export const CULTURA_STATUS_LABEL = {
  SECAGEM: "Secagem",
  COLHEITA: "Colheita",
  PLANTIO: "Plantio",
  ADUBACAO: "Adubação",
  PULVERIZACAO: "Pulverização",
};

/** Status exibido na tabela de gastos (derivado de status + vencimento). */
export const GASTO_STATUS_DISPLAY_TONE = {
  Pago: { label: "Pago", tone: "emerald" },
  Pendente: { label: "Pendente", tone: "amber" },
  Atrasado: { label: "Atrasado", tone: "red" },
};

export const HISTORICO_MAPA_STATUS_TONE = {
  COLHIDA: { label: "Colhida", tone: "green" },
  ENCERRADA: { label: "Encerrada", tone: "violet" },
  ARQUIVADA: { label: "Arquivada", tone: "gray" },
};

export const ESTOQUE_STATUS_TONE = {
  ESTOQUE_BAIXO: { label: "Estoque baixo", tone: "amber" },
  EM_ESTOQUE: { label: "Em estoque", tone: "green" },
};

export const INSUMO_CATEGORIA_TONE = {
  FERTILIZANTE: "emerald",
  DEFENSIVO: "orange",
  SEMENTE: "sky",
  OUTRO: "gray",
};

export const USUARIO_ROLE_TONE = {
  ADMIN: { tone: "violet" },
  FUNCIONARIO: { tone: "sky" },
};

export const NOTICIA_CATEGORIA_TONE = {
  CLIMA: { label: "Clima", tone: "sky" },
  MERCADO: { label: "Mercado", tone: "amber" },
  MANEJO: { label: "Manejo", tone: "green" },
  TECNOLOGIA: { label: "Tecnologia", tone: "violet" },
  POLITICAS: { label: "Políticas", tone: "gray" },
  SUSTENTABILIDADE: { label: "Sustentabilidade", tone: "teal" },
};

export const NOTIFICACAO_TIPO_TONE = {
  INSUMO_NOVO: { label: "Insumo", tone: "sky", card: "border-l-sky-500 bg-sky-50/50" },
  ARRENDAMENTO_RECEBER: { label: "Arrendamento", tone: "violet", card: "border-l-violet-500 bg-violet-50/50" },
  LEMBRETE: { label: "Lembrete", tone: "emerald", card: "border-l-emerald-500 bg-emerald-50/50" },
  GASTO_ATRASADO: { label: "Gasto atrasado", tone: "red", card: "border-l-red-500 bg-red-50/50" },
  GASTO: { label: "Gasto", tone: "red", card: "border-l-red-500 bg-red-50/50" },
};

/** @param {Record<string, { label?: string, tone?: string }>} map */
export function resolveBadgeFromMap(map, key, fallbackLabel) {
  const cfg = map[key];
  if (cfg && typeof cfg === "object" && "tone" in cfg) {
    return { label: cfg.label ?? fallbackLabel ?? String(key), tone: cfg.tone ?? "gray" };
  }
  if (typeof cfg === "string") {
    return { label: fallbackLabel ?? String(key), tone: cfg };
  }
  return { label: fallbackLabel ?? String(key ?? "—"), tone: "gray" };
}

export function getGastoDisplayStatus(status, vencimento) {
  if (status === "PAGO") return "Pago";
  if (!vencimento) return "Pendente";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${vencimento}T00:00:00`);
  return dueDate < today ? "Atrasado" : "Pendente";
}
