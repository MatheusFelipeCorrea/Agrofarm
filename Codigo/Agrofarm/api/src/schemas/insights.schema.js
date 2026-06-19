import { z } from "zod";

const fazendaIdQuery = z.union([z.string().uuid("fazendaId inválido"), z.literal("todas")]).default("todas");

export const insightsQuerySchema = z.object({
  fazendaId: fazendaIdQuery,
});

export const refreshInsightSchema = z.object({
  tipo: z.enum(["ESTOQUE", "LUCROS", "ANALISE_FAZENDAS", "FAZENDA_FIXA", "DICA_DIA", "SAUDACAO"]),
  fazendaId: fazendaIdQuery,
  fazendaCarouselId: z.string().uuid("fazendaCarouselId inválido").optional(),
});
