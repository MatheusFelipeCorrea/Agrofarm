export function parsePartesDataIso(dataIso) {
  const [ano, mes, dia] = String(dataIso).split("-").map(Number);
  return { ano, mes, dia };
}

/** Início do dia no fuso local (evita `new Date("YYYY-MM-DD")` em UTC). */
export function inicioDoDiaLocal(dataIso) {
  const { ano, mes, dia } = parsePartesDataIso(dataIso);
  return new Date(ano, mes - 1, dia, 0, 0, 0, 0);
}

/** Fim do dia no fuso local. */
export function fimDoDiaLocal(dataIso) {
  const { ano, mes, dia } = parsePartesDataIso(dataIso);
  return new Date(ano, mes - 1, dia, 23, 59, 59, 999);
}

/** Início do dia seguinte no fuso local. */
export function inicioDoProximoDiaLocal(dataIso) {
  const { ano, mes, dia } = parsePartesDataIso(dataIso);
  return new Date(ano, mes - 1, dia + 1, 0, 0, 0, 0);
}

export function chaveDiaLocal(valor) {
  const data = new Date(valor);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function calcularStatus(lembrete, agora = new Date()) {
  const data = new Date(lembrete.data_lembrete);

  if (lembrete.status === "PENDENTE" && data < agora) {
    return "ATRASADO";
  }

  return lembrete.status;
}