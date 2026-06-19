import { Router } from "express";
import { z } from "zod";
import { lembreteController } from "../controllers/lembrete.controller.js";
import {
  atualizarLembreteSchema,
  criarLembreteSchema,
  idSchema,
  provisionarWhatsappSchema,
  updateLembreteStatusSchema,
} from "../schemas/lembrete.schema.js";
import { validator } from "../middlewares/validator.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const lembreteDiaQuerySchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "data deve estar em YYYY-MM-DD"),
  status: z.enum(["PENDENTE", "ENVIADO", "CANCELADO", "ATRASADO"]).optional(),
  fazendaId: z.string().uuid("fazendaId inválido").optional(),
});

const lembreteCalendarioQuerySchema = z.object({
  mes: z.coerce.number().int().min(1).max(12),
  ano: z.coerce.number().int().min(2000).max(2100),
  status: z.enum(["PENDENTE", "ENVIADO", "CANCELADO", "ATRASADO"]).optional(),
  fazendaId: z.union([z.literal("all"), z.string().uuid("fazendaId inválido")]).optional(),
});

export const lembreteRoutes = Router();

lembreteRoutes.get("/", authMiddleware, lembreteController.listar);
lembreteRoutes.get(
  "/dia",
  authMiddleware,
  validator({ query: lembreteDiaQuerySchema }),
  lembreteController.getDia,
);
lembreteRoutes.get(
  "/calendario",
  authMiddleware,
  validator({ query: lembreteCalendarioQuerySchema }),
  lembreteController.getCalendario,
);
lembreteRoutes.get("/whatsapp/status", lembreteController.statusWhatsapp);
lembreteRoutes.post(
  "/whatsapp/provisionar",
  validator({ body: provisionarWhatsappSchema }),
  lembreteController.provisionarWhatsapp,
);
lembreteRoutes.patch(
  "/:id/status",
  authMiddleware,
  validator({
    params: idSchema,
    body: updateLembreteStatusSchema,
  }),
  lembreteController.updateStatus
);

lembreteRoutes.get("/:id", authMiddleware, validator({ params: idSchema }), lembreteController.buscarPorId);
lembreteRoutes.post("/", authMiddleware, validator({ body: criarLembreteSchema }), lembreteController.criar);
lembreteRoutes.put(
  "/:id",
  authMiddleware,
  validator({
    params: idSchema,
    body: atualizarLembreteSchema.refine(
      (body) => Object.keys(body).length > 0,
      "Informe ao menos um campo para atualizar",
    ),
  }),
  lembreteController.atualizar,
);
lembreteRoutes.delete("/:id", authMiddleware, validator({ params: idSchema }), lembreteController.remover);
lembreteRoutes.delete("/", authMiddleware, lembreteController.deleteAll);
lembreteRoutes.post(
  "/:id/enviar",
  authMiddleware,
  validator({
    params: idSchema,
    body: z.object({}).optional(),
  }),
  lembreteController.enviarAgora,
);