import { z } from "zod";

const categoriasValidas = [
  "TODAS",
  "CLIMA",
  "MERCADO",
  "MANEJO",
  "TECNOLOGIA",
  "POLITICAS",
  "SUSTENTABILIDADE",
];

export const listarNoticiasQuerySchema = z.object({
  categoria: z.enum(categoriasValidas).optional().default("TODAS"),
  busca: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(4).max(30).optional().default(12),
});
