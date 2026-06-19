import { describe, expect, it } from "vitest";
import {
  addMonths,
  expandirOcorrencias,
  expandirLembretesNoIntervalo,
  statusOcorrencia,
} from "../../utils/lembrete.recorrencia.js";
import { fimDoDiaLocal, inicioDoDiaLocal } from "../../utils/lembrete.utils.js";

describe("lembrete.recorrencia", () => {
  it("inclui lembrete da tarde/noite no intervalo local do dia", () => {
    const lembrete = {
      id: "3",
      status: "PENDENTE",
      recorrencia: "NENHUMA",
      recorrencia_custom: null,
      data_lembrete: new Date(2026, 6, 6, 18, 0, 0),
    };

    const ocorrencias = expandirOcorrencias(
      lembrete,
      inicioDoDiaLocal("2026-07-06"),
      fimDoDiaLocal("2026-07-06"),
    );

    expect(ocorrencias).toHaveLength(1);
  });

  it("expande lembrete mensal para o mes seguinte", () => {
    const lembrete = {
      id: "1",
      titulo: "Manutenção",
      status: "PENDENTE",
      recorrencia: "MENSAL",
      recorrencia_custom: null,
      data_lembrete: new Date("2026-05-10T18:00:00"),
    };

    const ocorrencias = expandirOcorrencias(
      lembrete,
      new Date("2026-06-01T00:00:00"),
      new Date("2026-06-30T23:59:59"),
    );

    expect(ocorrencias).toHaveLength(1);
    expect(ocorrencias[0].data_lembrete.getMonth()).toBe(5);
    expect(ocorrencias[0].data_lembrete.getDate()).toBe(10);
  });

  it("mantém futuras ocorrências pendentes mesmo com lembrete base enviado", () => {
    const lembrete = {
      id: "1",
      status: "ENVIADO",
      recorrencia: "MENSAL",
      recorrencia_custom: null,
      data_lembrete: new Date("2026-05-10T18:00:00"),
    };

    const futura = new Date("2026-06-10T18:00:00");

    expect(statusOcorrencia(lembrete, lembrete.data_lembrete)).toBe("ENVIADO");
    expect(statusOcorrencia(lembrete, futura, new Date("2026-06-01T10:00:00"))).toBe(
      "PENDENTE",
    );
  });

  it("addMonths respeita meses com menos dias", () => {
    const resultado = addMonths(new Date("2026-01-31T10:00:00"), 1);
    expect(resultado.getMonth()).toBe(1);
    expect(resultado.getDate()).toBe(28);
  });

  it("expandirLembretesNoIntervalo ordena por data", () => {
    const lembretes = [
      {
        id: "2",
        status: "PENDENTE",
        recorrencia: "SEMANAL",
        recorrencia_custom: null,
        data_lembrete: new Date("2026-06-01T10:00:00"),
      },
      {
        id: "1",
        status: "PENDENTE",
        recorrencia: "NENHUMA",
        recorrencia_custom: null,
        data_lembrete: new Date("2026-06-03T10:00:00"),
      },
    ];

    const resultado = expandirLembretesNoIntervalo(
      lembretes,
      new Date("2026-06-01T00:00:00"),
      new Date("2026-06-30T23:59:59"),
      new Date("2026-06-15T10:00:00"),
    );

    expect(resultado.length).toBeGreaterThan(1);
    expect(resultado[0].data_lembrete.getTime()).toBeLessThanOrEqual(
      resultado[1].data_lembrete.getTime(),
    );
  });
});
