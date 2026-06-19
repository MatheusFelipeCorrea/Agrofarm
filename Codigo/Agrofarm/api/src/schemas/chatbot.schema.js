import { z } from "zod";

export const enviarChatbotMensagemSchema = z.object({
  sessaoId: z.string().uuid().optional().nullable(),
  conteudo: z
    .string()
    .min(1, "Mensagem obrigatória")
    .max(8000, "Mensagem muito longa"),
});

export const listarSessoesQuerySchema = z.object({
  limite: z.coerce.number().int().positive().max(50).optional().default(20),
});

export const renomearSessaoChatbotSchema = z.object({
  titulo: z
    .string()
    .min(1, "Título obrigatório")
    .max(120, "Título muito longo"),
});
