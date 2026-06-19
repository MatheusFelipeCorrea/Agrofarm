import { z } from "zod";

const statusGastoSchema = z.enum(["PAGO", "PENDENTE"]);
const statusFiltroSchema = z.enum(["PAGO", "PENDENTE", "ATRASADO"]);

const optionalUuidQuery = (field) =>
  z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      return val;
    },
    z.string().uuid(`${field} inválido`).optional(),
  );

const optionalDateQuery = (field) =>
  z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      return val;
    },
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, `${field} deve estar em YYYY-MM-DD`)
      .optional(),
  );

const booleanQueryFlag = z.preprocess(
  (val) => val === "1" || val === "true" || val === true,
  z.boolean().optional(),
);

export const listarGastosQuerySchema = z.object({
  pendenteArrendamento: booleanQueryFlag,
  fazendaId: z
    .preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined) return undefined;
        return val;
      },
      z.union([z.literal("all"), z.string().uuid("fazendaId inválido")]).optional(),
    ),
  culturaId: optionalUuidQuery("culturaId"),
  status: statusFiltroSchema.optional(),
  from: optionalDateQuery("from"),
  to: optionalDateQuery("to"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const getPorColheitaParamsSchema = z.object({
  colheitaId: z.string().uuid("colheitaId inválido"),
});

export const criarGastoSchema = z
  .object({
    colheitaId: z.string().uuid("colheitaId inválido"),
    tipo: z.string().min(1).max(50),
    tipoPersonalizado: z.string().max(100).optional(),
    valor: z.number().positive(),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "data deve estar em YYYY-MM-DD"),
    dataVencimento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "dataVencimento deve estar em YYYY-MM-DD")
      .optional(),
    status: statusGastoSchema,
    descricao: z.string().max(500).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.tipo.toUpperCase() === "OUTRO" && !val.tipoPersonalizado?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tipoPersonalizado"],
        message: "Tipo personalizado obrigatorio",
      });
    }
  });

export const atualizarGastoSchema = z
  .object({
    colheitaId: z.string().uuid("colheitaId inválido").optional(),
    tipo: z.string().min(1).max(50).optional(),
    tipoPersonalizado: z.string().max(100).optional().nullable(),
    valor: z.number().positive().optional(),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "data deve estar em YYYY-MM-DD").optional(),
    dataVencimento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "dataVencimento deve estar em YYYY-MM-DD")
      .optional()
      .nullable(),
    status: statusGastoSchema.optional(),
    descricao: z.string().max(500).optional().nullable(),
  })
  .refine((body) => Object.keys(body).length > 0, "Informe ao menos um campo para atualizar")
  .superRefine((val, ctx) => {
    const tipo = val.tipo?.toUpperCase();
    if (tipo === "OUTRO" && !val.tipoPersonalizado?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tipoPersonalizado"],
        message: "Tipo personalizado obrigatorio",
      });
    }
  });

