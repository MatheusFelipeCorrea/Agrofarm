import cron from "node-cron";
import { lembreteService } from "../services/lembrete.service.js";
import { logger } from "../shared/utils/logger.js";

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

export function iniciarJobLembretes() {
  if (jobIniciado) {
    return;
  }

  cron.schedule("* * * * *", async () => {
    if (executando) {
      logger.warn("Job de lembretes em execucao, pulando ciclo atual");
      return;
    }

    executando = true;

    try {
      const resultado = await lembreteService.processarPendentes();
      ultimoErroDbLogadoEm = 0;
      logger.info(
        {
          ...resultado,
        },
        "Job de lembretes processado",
      );
    } catch (error) {
      if (isErroConexaoDb(error)) {
        const agora = Date.now();
        if (agora - ultimoErroDbLogadoEm > 5 * 60 * 1000) {
          ultimoErroDbLogadoEm = agora;
          logger.warn("Job de lembretes pausado: banco de dados indisponivel");
        }
      } else {
        logger.error({ err: error }, "Falha no job de lembretes");
      }
    } finally {
      executando = false;
    }
  });

  jobIniciado = true;
  logger.info("Job de lembretes iniciado (cron: a cada minuto)");
}
