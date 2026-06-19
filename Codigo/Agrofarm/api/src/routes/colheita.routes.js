import { Router } from "express";
import { colheitaController } from "../controllers/colheita.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validator } from "../middlewares/validator.middleware.js";
import { criarColheitaSchema, listarColheitasQuerySchema, fazendaIdParamSchema } from "../schemas/colheita.schema.js";
import { idSchema } from "../schemas/common.schema.js";
import { atualizarColheitaSchema } from "../schemas/colheita.schema.js";

export const colheitaRoutes = Router();

colheitaRoutes.use(authMiddleware);

colheitaRoutes.get("/", validator({ query: listarColheitasQuerySchema }), colheitaController.listar);
colheitaRoutes.get(
  "/fazenda/:fazendaId",
  validator({ params: fazendaIdParamSchema }),
  colheitaController.buscarPorFazenda,
);
colheitaRoutes.get("/:id", validator({ params: idSchema }), colheitaController.buscarPorId);
colheitaRoutes.post("/", validator({ body: criarColheitaSchema }), colheitaController.criar);
colheitaRoutes.put(
  "/:id",
  validator({
    params: idSchema,
    body: atualizarColheitaSchema,
  }),
  colheitaController.atualizar,
);
colheitaRoutes.delete("/:id", validator({ params: idSchema }), colheitaController.remover);

