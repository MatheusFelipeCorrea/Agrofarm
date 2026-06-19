import { Router } from "express";
import { chatbotController } from "../controllers/chatbot.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validator } from "../middlewares/validator.middleware.js";
import { idSchema } from "../schemas/common.schema.js";
import {
  enviarChatbotMensagemSchema,
  listarSessoesQuerySchema,
  renomearSessaoChatbotSchema,
} from "../schemas/chatbot.schema.js";

export const chatbotRoutes = Router();

chatbotRoutes.get("/resumo", authMiddleware, chatbotController.resumo);

chatbotRoutes.get("/consultas-factuais", authMiddleware, chatbotController.consultasFactuais);

chatbotRoutes.get(
  "/sessoes",
  authMiddleware,
  validator({ query: listarSessoesQuerySchema }),
  chatbotController.listarSessoes,
);

chatbotRoutes.get(
  "/sessoes/:id/mensagens",
  authMiddleware,
  validator({ params: idSchema }),
  chatbotController.listarMensagens,
);

chatbotRoutes.patch(
  "/sessoes/:id",
  authMiddleware,
  validator({ params: idSchema, body: renomearSessaoChatbotSchema }),
  chatbotController.renomearSessao,
);

chatbotRoutes.delete(
  "/sessoes/:id",
  authMiddleware,
  validator({ params: idSchema }),
  chatbotController.excluirSessao,
);

chatbotRoutes.post(
  "/mensagens",
  authMiddleware,
  validator({ body: enviarChatbotMensagemSchema }),
  chatbotController.enviar,
);
