import { Router } from "express";
import { insumoController } from "../controllers/insumo.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validator } from "../middlewares/validator.middleware.js";
import { idSchema } from "../schemas/common.schema.js";
import { atualizarInsumoSchema, criarInsumoSchema, listarInsumosQuerySchema } from "../schemas/insumo.schema.js";

export const insumoRoutes = Router();

insumoRoutes.use(authMiddleware);

insumoRoutes.get("/", validator({ query: listarInsumosQuerySchema }), insumoController.listar);
insumoRoutes.post("/", validator({ body: criarInsumoSchema }), insumoController.criar);
insumoRoutes.put(
  "/:id",
  validator({
    params: idSchema,
    body: atualizarInsumoSchema,
  }),
  insumoController.atualizar,
);
insumoRoutes.delete("/:id", validator({ params: idSchema }), insumoController.remover);
