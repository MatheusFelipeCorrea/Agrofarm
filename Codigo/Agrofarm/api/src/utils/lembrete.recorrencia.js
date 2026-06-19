import { calcularStatus } from "./lembrete.utils.js";

const MAX_OCORRENCIAS = 500;

export function temRecorrencia(recorrencia) {
  return Boolean(recorrencia && recorrencia !== "NENHUMA");
}

export function parseIntervaloOutros(recorrenciaCustom) {
  const texto = String(recorrenciaCustom ?? "").trim();
  const dias = texto.match(/(\d+)\s*dias?/i);
  if (dias) return Number(dias[1]);

  const semanas = texto.match(/(\d+)\s*semanas?/i);
  if (semanas) return Number(semanas[1]) * 7;

  return 30;
}

export function addMonths(anchor, months) {
  const data = new Date(anchor);
  const dia = data.getDate();

  data.setDate(1);
  data.setMonth(data.getMonth() + months);

  const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
  data.setDate(Math.min(dia, ultimoDia));

  return data;
}

export function avancarOcorrencia(data, recorrencia, recorrenciaCustom) {
  const atual = new Date(data);

  switch (recorrencia) {
    case "SEMANAL":
      atual.setDate(atual.getDate() + 7);
      return atual;
    case "MENSAL":
      return addMonths(atual, 1);
    case "TRIMESTRAL":
      return addMonths(atual, 3);
    case "ANUAL":
      atual.setFullYear(atual.getFullYear() + 1);
      return atual;
    case "OUTROS":
      atual.setDate(atual.getDate() + parseIntervaloOutros(recorrenciaCustom));
      return atual;
    default:
      return null;
  }
}

export function mesmaOcorrencia(dataA, dataB, toleranciaMs = 60_000) {
  const a = new Date(dataA).getTime();
  const b = new Date(dataB).getTime();
  return Math.abs(a - b) <= toleranciaMs;
}

export function statusOcorrencia(lembrete, dataOcorrencia, agora = new Date()) {
  if (lembrete.status === "CANCELADO") return "CANCELADO";

  const mesmaDataBase = mesmaOcorrencia(lembrete.data_lembrete, dataOcorrencia);

  if (mesmaDataBase && lembrete.status === "ENVIADO") {
    return "ENVIADO";
  }

  return calcularStatus(
    { ...lembrete, data_lembrete: dataOcorrencia, status: "PENDENTE" },
    agora,
  );
}

export function expandirOcorrencias(lembrete, rangeStart, rangeEnd) {
  if (lembrete.status === "CANCELADO") return [];

  const inicio = new Date(rangeStart);
  const fim = new Date(rangeEnd);
  const anchor = new Date(lembrete.data_lembrete);

  if (!temRecorrencia(lembrete.recorrencia)) {
    return anchor >= inicio && anchor <= fim
      ? [{ ...lembrete, data_lembrete: anchor }]
      : [];
  }

  const ocorrencias = [];
  let cursor = new Date(anchor);
  let guard = 0;

  while (cursor < inicio && guard < MAX_OCORRENCIAS) {
    const proxima = avancarOcorrencia(
      cursor,
      lembrete.recorrencia,
      lembrete.recorrencia_custom,
    );
    if (!proxima || proxima.getTime() <= cursor.getTime()) break;
    cursor = proxima;
    guard += 1;
  }

  while (cursor <= fim && guard < MAX_OCORRENCIAS) {
    if (cursor >= inicio) {
      ocorrencias.push({ ...lembrete, data_lembrete: new Date(cursor) });
    }

    const proxima = avancarOcorrencia(
      cursor,
      lembrete.recorrencia,
      lembrete.recorrencia_custom,
    );
    if (!proxima || proxima.getTime() <= cursor.getTime()) break;
    cursor = proxima;
    guard += 1;
  }

  return ocorrencias;
}

export function expandirLembretesNoIntervalo(lembretes, rangeStart, rangeEnd, agora = new Date()) {
  const resultado = [];

  for (const lembrete of lembretes) {
    const ocorrencias = expandirOcorrencias(lembrete, rangeStart, rangeEnd);

    for (const ocorrencia of ocorrencias) {
      resultado.push({
        ...ocorrencia,
        status: statusOcorrencia(lembrete, ocorrencia.data_lembrete, agora),
      });
    }
  }

  resultado.sort(
    (a, b) => new Date(a.data_lembrete).getTime() - new Date(b.data_lembrete).getTime(),
  );

  return resultado;
}

export function montarFiltroDataComRecorrencia(inicio, fim) {
  return {
    OR: [
      {
        data_lembrete: {
          gte: inicio,
          lte: fim,
        },
      },
      {
        recorrencia: { not: "NENHUMA" },
        data_lembrete: { lte: fim },
      },
    ],
  };
}

export function montarWhereLembretes({
  inicio,
  fim,
  fazendasFiltradas,
  filtroEspecificoFazenda,
}) {
  const filtros = [
    montarFiltroDataComRecorrencia(inicio, fim),
    { status: { not: "CANCELADO" } },
  ];

  if (fazendasFiltradas === null) {
  } else if (fazendasFiltradas.length === 0) {
    filtros.push({ fazenda_id: filtroEspecificoFazenda ? { in: [] } : null });
  } else if (filtroEspecificoFazenda) {
    filtros.push({ fazenda_id: { in: fazendasFiltradas } });
  } else {
    filtros.push({
      OR: [
        { fazenda_id: { in: fazendasFiltradas } },
        { fazenda_id: null },
      ],
    });
  }

  return { AND: filtros };
}
