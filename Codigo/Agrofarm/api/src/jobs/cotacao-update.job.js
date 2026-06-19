import cron from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../shared/utils/logger.js";
import { cotacaoService } from "../services/cotacao.service.js";

let jobIniciado = false;
let executando = false;

/**
 * Executa a atualização de cotações (dólar e euro)
 * Salva os valores no banco de dados automaticamente
 */
export async function executarAtualizacaoCotacoes() {
  try {
    const [dolarResult, euroResult] = await Promise.allSettled([
      cotacaoService.buscarDolar(),
      cotacaoService.buscarEuro(),
    ]);

    const resultado = {
      timestamp: new Date().toISOString(),
      dolar: {
        status: dolarResult.status,
        valor: dolarResult.status === "fulfilled" ? dolarResult.value?.valor : null,
        erro: dolarResult.status === "rejected" ? dolarResult.reason?.message : null,
      },
      euro: {
        status: euroResult.status,
        valor: euroResult.status === "fulfilled" ? euroResult.value?.valor : null,
        erro: euroResult.status === "rejected" ? euroResult.reason?.message : null,
      },
    };

    if (dolarResult.status === "fulfilled" && euroResult.status === "fulfilled") {
      logger.info(resultado, "✅ Cotações atualizadas e salvas no banco com sucesso");
    } else {
      logger.warn(resultado, "⚠️ Atualização de cotações parcialmente bem-sucedida");
    }

    return resultado;
  } catch (error) {
    const resultado = {
      timestamp: new Date().toISOString(),
      erro: error.message,
      status: "falhou",
    };

    logger.error(
      { ...resultado, stack: error.stack },
      "❌ Falha crítica na atualização de cotações"
    );

    return resultado;
  }
}

/**
 * Inicia o job agendado que executa a cada 2 horas
 * Horários: 00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00
 */
export function iniciarJobAtualizacaoCotacoes() {
  if (jobIniciado) {
    logger.warn("Job de atualização de cotações já está iniciado");
    return;
  }

  const cronExpression = env.COTACAO_UPDATE_CRON || "0 */2 * * *";
  const timezone = env.COTACAO_UPDATE_TIMEZONE || "America/Sao_Paulo";

  cron.schedule(
    cronExpression,
    async () => {
      if (executando) {
        logger.warn("Job de atualização de cotações em execução, pulando ciclo atual");
        return;
      }

      executando = true;

      try {
        await executarAtualizacaoCotacoes();
      } catch (error) {
        logger.error({ err: error }, "Falha no job de atualização de cotações");
      } finally {
        executando = false;
      }
    },
    { timezone }
  );

  jobIniciado = true;
  logger.info(
    {
      cron: cronExpression,
      timezone,
      proximo: "A cada 2 horas (00:00, 02:00, 04:00, ...)",
    },
    "✅ Job de atualização de cotações iniciado"
  );
}

/**
 * Para o job se necessário
 */
export function pararJobAtualizacaoCotacoes() {
  jobIniciado = false;
  executando = false;
}
