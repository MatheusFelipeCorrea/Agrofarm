import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const AGRO_PICKER_BRAND = "#2e5b47";
export const AGRO_PICKER_BRAND_LIGHT = "#e8f3ee";

export const AGRO_PICKER_POPOVER_CLASS =
  "z-[250] w-auto max-w-[17.5rem] rounded-lg border border-gray-200 bg-white p-2 text-sm text-gray-900 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out";

export const AGRO_PICKER_POPOVER_RANGE_CLASS =
  "z-[250] w-auto max-w-[36rem] rounded-lg border border-gray-200 bg-white p-2 text-sm text-gray-900 shadow-lg";

export const AGRO_DAY_PICKER_COMPACT_CLASS = "agro-day-picker-compact";

export const AGRO_PICKER_TRIGGER_CLASS =
  "relative flex h-10 w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-left text-sm shadow-sm transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/25";

export const dayPickerClassNames = {
  chevron: "fill-[#2e5b47]",
  button_previous: "rounded-md text-[#2e5b47] hover:bg-[#e8f3ee]",
  button_next: "rounded-md text-[#2e5b47] hover:bg-[#e8f3ee]",
  today: "font-semibold text-[#2e5b47]",
  selected: "rounded-md bg-[#2e5b47] text-white hover:bg-[#244a3a] hover:text-white focus:bg-[#2e5b47] focus:text-white",
};

export const dayPickerStyle = {
  "--rdp-accent-color": AGRO_PICKER_BRAND,
  "--rdp-selected-border": "2px solid #2e5b47",
  "--rdp-today-color": AGRO_PICKER_BRAND,
};

export const dayPickerFormatters = {
  formatWeekdayName: (date) => format(date, "EEE", { locale: ptBR }).replace(".", "").slice(0, 3),
};

export function formatDateLabel(value, fallback = "Selecione a data") {
  if (!value) return fallback;
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return fallback;
  return `${day}/${month}/${year}`;
}

export function parseIsoDate(value) {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function formatTimeLabel(value, fallback = "Selecione a hora") {
  if (!value) return fallback;
  const [hour, minute] = value.split(":");
  if (!hour || !minute) return fallback;
  return `${hour}:${minute}`;
}

export function parseTimeValue(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return { hour: "09", minute: "00" };
  }
  const [hour, minute] = value.split(":");
  return { hour, minute };
}
