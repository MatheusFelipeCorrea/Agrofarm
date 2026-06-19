import cron from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../shared/utils/logger.js";
import { poligonoHistoricoService } from "../services/poligonoHistorico.service.js";

let jobIniciado = false;
let executando = false;
let ultimoErroDbLogadoEm = 0;

function isErroConexaoDb(error) {
  const msg = String(error?.message ?? error);
  return (
    error?.name === "PrismaClientInitializationError" ||
    msg.includes("Can't reach database server") ||
    msg.includes("ECONNREFUSED")
  );
}

export async function executarArquivamentoMapa() {
  const resultado = await poligonoHistoricoService.processarColheitasVencidas();
  logger.info(resultado, "Arquivamento automatico de talhoes processado");
  return resultado;
}

export function iniciarJobArquivamentoMapa() {
  if (jobIniciado) {
    return;
  }

  cron.schedule(
    env.POLIGONO_ARQUIVAMENTO_CRON,
    async () => {
      if (executando) {
        logger.warn("Job de arquivamento de talhoes em execucao, pulando ciclo atual");
        return;
      }

      executando = true;

      try {
        await executarArquivamentoMapa();
        ultimoErroDbLogadoEm = 0;
      } catch (error) {
        if (isErroConexaoDb(error)) {
          const agora = Date.now();
          if (agora - ultimoErroDbLogadoEm > 5 * 60 * 1000) {
            ultimoErroDbLogadoEm = agora;
            logger.warn("Job de arquivamento de talhoes pausado: banco de dados indisponivel");
          }
        } else {
          logger.error({ err: error }, "Falha no job de arquivamento de talhoes");
        }
      } finally {
        executando = false;
      }
    },
    { timezone: env.POLIGONO_ARQUIVAMENTO_TIMEZONE },
  );

  jobIniciado = true;
  logger.info(
    {
      cron: env.POLIGONO_ARQUIVAMENTO_CRON,
      timezone: env.POLIGONO_ARQUIVAMENTO_TIMEZONE,
    },
    "Job de arquivamento automatico de talhoes iniciado",
  );
}
