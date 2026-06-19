/**
 * Estilos padrão das tabelas de dados (referência: InsumosTable).
 */
export const agroTable = {
  section: "overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm",
  loadingSection: "rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-600 shadow-sm",
  scroll: "overflow-x-auto",
  table: "w-full border-collapse text-sm",
  headRow: "border-b border-gray-200 bg-white text-xs font-semibold tracking-wide text-gray-700",
  th: (align = "center") => {
    const base = "whitespace-nowrap px-4 py-3";
    if (align === "left") return `${base} text-left`;
    if (align === "right") return `${base} text-right`;
    return `${base} text-center`;
  },
  row: "border-b border-gray-100 last:border-0 hover:bg-gray-50/60",
  rowInteractive: "border-b border-gray-100 last:border-0 cursor-pointer transition-colors duration-150 hover:bg-gray-50/60",
  td: (align = "center") => {
    const base = "px-4 py-3";
    if (align === "left") return `${base} text-left text-gray-800`;
    if (align === "right") return `${base} text-right text-gray-800`;
    return `${base} text-center text-gray-800`;
  },
  tdMedium: (align = "center") => {
    const base = "px-4 py-3 font-medium text-gray-900";
    if (align === "left") return `${base} text-left`;
    if (align === "right") return `${base} text-right`;
    return `${base} text-center`;
  },
  tdBold: (align = "center") => {
    const base = "px-4 py-3 font-semibold text-gray-900";
    if (align === "left") return `${base} text-left`;
    if (align === "right") return `${base} text-right`;
    return `${base} text-center`;
  },
  empty: "px-4 py-12 text-center text-gray-500",
  actions: "flex items-center justify-center gap-2",
  actionBtn:
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50",
  actionBtnDanger:
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-red-500 transition-colors hover:bg-red-50",
  footer:
    "flex flex-col gap-3 border-t border-gray-200 px-4 py-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between",
};
