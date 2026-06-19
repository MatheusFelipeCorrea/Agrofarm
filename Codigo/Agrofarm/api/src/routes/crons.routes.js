import { Router } from "express";
import { executarAtualizacaoCotacoes } from "../jobs/cotacao-update.job.js";
import { executarLimpezaCotacoes } from "../jobs/cotacao-cleanup.job.js";
import { executarArquivamentoMapa } from "../jobs/arquivamento-mapa.job.js";
import { lembreteService } from "../services/lembrete.service.js";
import { logger } from "../shared/utils/logger.js";

export const cronRoutes = Router();

function verificarCronSecret(req, res, next) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return next();

  if (req.headers["authorization"] !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

cronRoutes.get("/cotacao-update", verificarCronSecret, async (_req, res) => {
  try {
    const resultado = await executarAtualizacaoCotacoes();
    res.json({ ok: true, resultado });
  } catch (error) {
    logger.error({ err: error }, "Falha no cron de cotacao-update");
    res.status(500).json({ ok: false, erro: error.message });
  }
});

cronRoutes.get("/cotacao-cleanup", verificarCronSecret, async (_req, res) => {
  try {
    const resultado = await executarLimpezaCotacoes();
    res.json({ ok: true, resultado });
  } catch (error) {
    logger.error({ err: error }, "Falha no cron de cotacao-cleanup");
    res.status(500).json({ ok: false, erro: error.message });
  }
});

cronRoutes.get("/arquivamento-mapa", verificarCronSecret, async (_req, res) => {
  try {
    const resultado = await executarArquivamentoMapa();
    res.json({ ok: true, resultado });
  } catch (error) {
    logger.error({ err: error }, "Falha no cron de arquivamento-mapa");
    res.status(500).json({ ok: false, erro: error.message });
  }
});

cronRoutes.get("/lembretes", verificarCronSecret, async (_req, res) => {
  try {
    const resultado = await lembreteService.processarPendentes();
    res.json({ ok: true, resultado });
  } catch (error) {
    logger.error({ err: error }, "Falha no cron de lembretes");
    res.status(500).json({ ok: false, erro: error.message });
  }
});
