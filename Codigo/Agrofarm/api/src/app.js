import cors from "cors";
import express from "express";
import helmet from "helmet";
import { corsOptions } from "./config/cors.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { router } from "./routes/index.js";

export const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(loggerMiddleware);

app.use("/api", router);

app.use((_, res) => {
  res.status(404).json({
    status: "error",
    message: "Rota nao encontrada",
  });
});

app.use(errorMiddleware);
