import { AppError } from "../shared/errors/AppError.js";
import { logger } from "../shared/utils/logger.js";

function isAppError(error) {
  return (
    error instanceof AppError ||
    (error?.name === "AppError" &&
      typeof error.statusCode === "number" &&
      error.statusCode >= 400 &&
      error.statusCode < 600)
  );
}

export function errorMiddleware(error, _req, res, _next) {
  if (isAppError(error)) {
    logger.warn({
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    });

    res.status(error.statusCode).json({
      status: "error",
      message: error.message,
      details: error.details,
    });
    return;
  }

  logger.error(
    {
      err: error,
    },
    "Erro interno nao tratado",
  );

  res.status(500).json({
    status: "error",
    message: "Erro interno do servidor",
  });
}
