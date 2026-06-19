import cron from "node-cron";
import { prisma } from "../database/client.js";
import { env } from "../config/env.js";
import { logger } from "../shared/utils/logger.js";
import { cotacaoService } from "../services/cotacao.service.js";

let jobIniciado = false;
let executando = false;

export async function executarLimpezaCotacoes() {
  const { count } = await prisma.cotacoes.deleteMany({
    where: {},
  });

  const [warmupUsd, warmupEur] = await Promise.allSettled([
    cotacaoService.buscarDolar(),
    cotacaoService.buscarEuro(),
  ]);

  const resultado = {
    removidos: count,
    warmupUsd: warmupUsd.status,
    warmupEur: warmupEur.status,
  };

  logger.info(resultado, "Reset semanal de historico de cotacoes executado");
  return resultado;
}

export function iniciarJobLimpezaCotacoes() {
  if (jobIniciado) {
    return;
  }

  cron.schedule(
    env.COTACAO_CLEANUP_CRON,
    async () => {
      if (executando) {
        logger.warn("Job de limpeza de cotacoes em execucao, pulando ciclo atual");
        return;
      }

      executando = true;

      try {
        await executarLimpezaCotacoes();
      } catch (error) {
        logger.error({ err: error }, "Falha no job de limpeza de cotacoes");
      } finally {
        executando = false;
      }
    },
    { timezone: env.COTACAO_CLEANUP_TIMEZONE },
  );

  jobIniciado = true;
  logger.info(
    {
      cron: env.COTACAO_CLEANUP_CRON,
      timezone: env.COTACAO_CLEANUP_TIMEZONE,
    },
    "Job de reset semanal de cotacoes iniciado",
  );
}
