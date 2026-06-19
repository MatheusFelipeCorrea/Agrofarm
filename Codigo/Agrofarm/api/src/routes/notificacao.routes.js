import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validator } from "../middlewares/validator.middleware.js";
import { idSchema } from "../schemas/common.schema.js";
import { listarNotificacoesQuerySchema } from "../schemas/notificacao.schema.js";
import { notificacaoController } from "../controllers/notificacao.controller.js";

export const notificacaoRoutes = Router();

notificacaoRoutes.use(authMiddleware);
notificacaoRoutes.get("/", validator({ query: listarNotificacoesQuerySchema }), notificacaoController.listar);
notificacaoRoutes.patch("/lidas", notificacaoController.marcarTodasComoLidas);
notificacaoRoutes.patch("/:id/lida", validator({ params: idSchema }), notificacaoController.marcarComoLida);
