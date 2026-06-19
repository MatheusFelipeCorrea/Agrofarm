import { z } from "zod";

export const listarNotificacoesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});
