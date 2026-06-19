import { z } from "zod";

const fazendaIdSchema = z.union([z.literal("todas"), z.string().uuid("fazendaId inválido")]);

export const dashboardFiltroQuerySchema = z.object({
  fazendaId: fazendaIdSchema,
});

export const dashboardFiltroSchema = {
  query: dashboardFiltroQuerySchema,
};