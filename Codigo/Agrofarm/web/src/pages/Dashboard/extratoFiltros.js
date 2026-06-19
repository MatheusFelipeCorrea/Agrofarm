import { parseISO, isValid, startOfDay, endOfDay } from "date-fns";

function parseDataMovimento(movimento) {
  const raw = movimento?.criadoEm ?? movimento?.data;
  if (!raw) return null;

  const direto = raw instanceof Date ? raw : new Date(raw);
  if (isValid(direto)) return direto;

  const iso = String(raw).slice(0, 10);
  const parsed = parseISO(iso);
  return isValid(parsed) ? parsed : null;
}

export function filtrarMovimentosPorPeriodo(itens, { from = "", to = "" } = {}) {
  if (!from && !to) return itens ?? [];

  const inicio = from ? startOfDay(parseISO(from)) : null;
  const fim = to ? endOfDay(parseISO(to)) : null;

  if (from && !isValid(inicio)) return itens ?? [];
  if (to && !isValid(fim)) return itens ?? [];

  return (itens ?? []).filter((item) => {
    const data = parseDataMovimento(item);
    if (!data) return false;
    if (inicio && data < inicio) return false;
    if (fim && data > fim) return false;
    return true;
  });
}
