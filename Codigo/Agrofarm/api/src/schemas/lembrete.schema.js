import { z } from "zod";

const statusLembrete = z.enum(["PENDENTE", "ENVIADO", "CANCELADO"]).optional();
const recorrenciaLembrete = z.enum(["NENHUMA", "SEMANAL", "MENSAL", "TRIMESTRAL", "ANUAL", "OUTROS"]).optional();

function validarRecorrenciaCustom(val, ctx) {
  if (val.recorrencia === "OUTROS" && !val.recorrenciaCustom?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["recorrenciaCustom"],
      message: "Informe a recorrencia personalizada quando selecionar OUTROS",
    });
  }
}

export const idSchema = z.object({
  id: z.string().min(1),
});

const uuidOpcional = z.string().uuid().nullish();

const lembreteSchemaBase = z.object({
  fazendaId: uuidOpcional,
  colheitaId: uuidOpcional,
  poligonoId: uuidOpcional,
  titulo: z.string().min(3, "titulo precisa ter ao menos 3 caracteres"),
  descricao: z.string().trim().optional(),
  dataLembrete: z.coerce.date(),
  telefoneWhatsapp: z.string().trim().optional(),
  recorrencia: recorrenciaLembrete,
  recorrenciaCustom: z.string().trim().max(120).optional(),
  status: statusLembrete.optional(),
});

export const criarLembreteSchema = lembreteSchemaBase.superRefine(validarRecorrenciaCustom);

export const atualizarLembreteSchema = lembreteSchemaBase.partial().superRefine(validarRecorrenciaCustom);

export const provisionarWhatsappSchema = z.object({
  numero: z.string().trim().optional(),
});

export const updateLembreteStatusSchema = z.object({
  status: statusLembrete,
});
