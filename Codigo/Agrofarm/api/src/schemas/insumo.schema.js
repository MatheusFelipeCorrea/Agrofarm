import { z } from "zod";

const categoriaEnum = z.enum(["FERTILIZANTE", "DEFENSIVO", "SEMENTE", "OUTRO"]);

function optionalQueryString(schema) {
  return z.preprocess((value) => {
    if (value === "" || value === undefined || value === null) return undefined;
    return value;
  }, schema.optional());
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const listarInsumosQuerySchema = z.object({
  fazendaId: optionalQueryString(z.union([z.literal("all"), z.string().uuid("fazendaId invalido")])) ,
  categoria: optionalQueryString(categoriaEnum),
  itemNome: optionalQueryString(z.string().min(1).max(150)),
  from: optionalQueryString(z.string().regex(datePattern, "from deve estar em YYYY-MM-DD")),
  to: optionalQueryString(z.string().regex(datePattern, "to deve estar em YYYY-MM-DD")),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(5),
});

export const criarInsumoSchema = z.object({
  fazendaId: z.string().uuid("fazendaId invalido"),
  item: z.string().min(1).max(150),
  categoria: categoriaEnum,
  quantidade: z.number().positive(),
  unidade: z.string().min(1).max(20),
  valorUnitario: z.number().min(0),
  fornecedor: z.string().max(200).optional(),
  observacao: z.string().max(500).optional(),
  data: z.string().regex(datePattern, "data deve estar em YYYY-MM-DD"),
});

export const atualizarInsumoSchema = z
  .object({
    fazendaId: z.string().uuid("fazendaId invalido").optional(),
    item: z.string().min(1).max(150).optional(),
    categoria: categoriaEnum.optional(),
    quantidade: z.number().positive().optional(),
    unidade: z.string().min(1).max(20).optional(),
    valorUnitario: z.number().min(0).optional(),
    fornecedor: z.string().max(200).optional().nullable(),
    observacao: z.string().max(500).optional().nullable(),
    data: z.string().regex(datePattern, "data deve estar em YYYY-MM-DD").optional(),
  })
  .refine((body) => Object.keys(body).length > 0, "Informe ao menos um campo para atualizar");
