import { z } from "zod";

const optionalFazendaIdQuery = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    return val;
  },
  z.union([z.literal("all"), z.string().uuid("fazendaId inválido")]).optional(),
);

const optionalUuidQuery = (field) =>
  z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      return val;
    },
    z.string().uuid(`${field} inválido`).optional(),
  );

const optionalIntQuery = (field) =>
  z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      return val;
    },
    z.coerce.number().int(`${field} inválido`).optional(),
  );

const optionalDateQuery = (field) =>
  z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      return val;
    },
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${field} inválido`).optional(),
  );

export const listarColheitasQuerySchema = z.object({
  fazendaId: optionalFazendaIdQuery,
  culturaId: optionalUuidQuery("culturaId"),
  mes: optionalIntQuery("mes").refine((v) => v === undefined || (v >= 1 && v <= 12), "mes inválido"),
  ano: optionalIntQuery("ano").refine((v) => v === undefined || (v >= 1900 && v <= 2500), "ano inválido"),
  from: optionalDateQuery("from"),
  to: optionalDateQuery("to"),
});

export const fazendaIdParamSchema = z.object({
  fazendaId: z.string().uuid("fazendaId inválido"),
});

export const criarColheitaSchema = z.object({
  fazendaId: z.string().uuid("fazendaId inválido"),
  culturaId: z.string().uuid("culturaId inválido"),
  ano: z.coerce.number().int().min(1900).max(2500).optional(),
  dataColheita: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dataColheita deve estar em YYYY-MM-DD"),
  area: z.coerce.number().nonnegative().optional(),
  sacasProduzidas: z.coerce.number().positive(),
});

export const atualizarColheitaSchema = z
  .object({
    fazendaId: z.string().uuid("fazendaId inválido").optional(),
    culturaId: z.string().uuid("culturaId inválido").optional(),
    ano: z.coerce.number().int().min(1900).max(2500).optional(),
    dataColheita: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "dataColheita deve estar em YYYY-MM-DD")
      .optional(),
    area: z.coerce.number().nonnegative().optional(),
    sacasProduzidas: z.coerce.number().positive().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, "Informe ao menos um campo para atualizar");

