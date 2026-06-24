import { Router } from "express";
import { z } from "zod";
import { gastoController } from "../controllers/gasto.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validator } from "../middlewares/validator.middleware.js";
import { idSchema } from "../schemas/common.schema.js";
import {
  atualizarGastoSchema,
  criarGastoSchema,
  getPorColheitaParamsSchema,
  listarGastosQuerySchema,
} from "../schemas/gasto.schema.js";

export const gastoRoutes = Router();

gastoRoutes.use(authMiddleware);

gastoRoutes.get("/", validator({ query: listarGastosQuerySchema }), gastoController.getAll);
gastoRoutes.get("/resumo", validator({ query: listarGastosQuerySchema }), gastoController.getResumo);
gastoRoutes.get(
  "/colheita/:colheitaId",
  validator({ params: getPorColheitaParamsSchema, query: listarGastosQuerySchema }),
  gastoController.getPorColheita,
);

gastoRoutes.post("/", validator({ body: criarGastoSchema }), gastoController.create);
gastoRoutes.put(
  "/:id",
  validator({
    params: idSchema,
    body: atualizarGastoSchema,
  }),
  gastoController.update,
);
gastoRoutes.delete("/:id", validator({ params: idSchema }), gastoController.delete);

