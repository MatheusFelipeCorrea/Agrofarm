import { app } from "./app.js";
import { env } from "./config/env.js";
import { iniciarJobLimpezaCotacoes } from "./jobs/cotacao-cleanup.job.js";
import { iniciarJobAtualizacaoCotacoes } from "./jobs/cotacao-update.job.js";
import { iniciarJobLembretes } from "./jobs/lembretes.job.js";
import { iniciarJobArquivamentoMapa } from "./jobs/arquivamento-mapa.job.js";
import { logger } from "./shared/utils/logger.js";

app.listen(env.PORT, () => {
  logger.info(`API online na porta ${env.PORT}`);
  iniciarJobLembretes();
  iniciarJobLimpezaCotacoes();
  iniciarJobAtualizacaoCotacoes();
  iniciarJobArquivamentoMapa();
});
