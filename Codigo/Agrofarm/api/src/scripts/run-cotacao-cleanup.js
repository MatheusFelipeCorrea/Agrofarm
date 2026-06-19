import prisma from "../database/client.js";
import { executarLimpezaCotacoes } from "../jobs/cotacao-cleanup.job.js";
import { logger } from "../shared/utils/logger.js";

try {
  const resultado = await executarLimpezaCotacoes();
  logger.info(resultado, "Limpeza manual de cotacoes finalizada");
} catch (error) {
  logger.error({ err: error }, "Falha na limpeza manual de cotacoes");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
