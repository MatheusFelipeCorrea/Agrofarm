import { logger } from "../shared/utils/logger.js";

export function loggerMiddleware(req, res, next) {
  const inicio = Date.now();

  res.on("finish", () => {
    const duracaoMs = Date.now() - inicio;
    logger.info({
      metodo: req.method,
      rota: req.originalUrl,
      status: res.statusCode,
      duracaoMs,
    });
  });

  next();
}
