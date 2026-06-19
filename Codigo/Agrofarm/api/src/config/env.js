import dotenv from "dotenv";
import { z } from "zod";

// override: true — no Windows, variáveis de usuário/sistema não podem ficar com valor antigo e ignorar o .env
dotenv.config({ override: true });

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3333),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL obrigatoria"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL obrigatoria"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET obrigatoria").default("dev-secret"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  EVOLUTION_API_URL: z.string().optional(),
  EVOLUTION_API_KEY: z.string().optional(),
  EVOLUTION_INSTANCE: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_API_KEY_CHATBOT: z.string().optional(),
  GEMINI_API_KEY_INSIGHTS: z.string().optional(),
  COTACAO_CLEANUP_CRON: z.string().default("0 3 * * 0"),
  COTACAO_CLEANUP_TIMEZONE: z.string().default("America/Sao_Paulo"),
  COTACAO_UPDATE_CRON: z.string().default("0 */2 * * *"),
  COTACAO_UPDATE_TIMEZONE: z.string().default("America/Sao_Paulo"),
  POLIGONO_ARQUIVAMENTO_CRON: z.string().default("5 0 * * *"),
  POLIGONO_ARQUIVAMENTO_TIMEZONE: z.string().default("America/Sao_Paulo"),
  TAX_ESTIMATOR_API_URL: z.string().optional(),
  TAX_ESTIMATOR_API_KEY: z.string().optional(),
  TAX_ESTIMATOR_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  IBPT_ENABLED: z.string().optional(),
  IBPT_TOKEN: z.string().optional(),
  IBPT_CNPJ: z.string().optional(),
  IBPT_UF: z.string().optional(),
  IBPT_API_URL: z.string().optional(),
  IBPT_VALRAW_BASE_URL: z.string().optional(),
  IBPT_VALRAW_TABELA: z.string().optional(),
  IBPT_UNIDADE_MEDIDA: z.string().optional(),
  IBPT_GTIN: z.string().optional(),
}).superRefine((data, ctx) => {
  // Em produção, o segredo do JWT não pode ser o default de desenvolvimento
  // nem ser fraco — caso contrário tokens poderiam ser forjados.
  if (data.NODE_ENV === "production") {
    if (data.JWT_SECRET === "dev-secret" || data.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message:
          "JWT_SECRET deve ser forte (>=32 caracteres) e diferente do default em producao",
      });
    }
  }
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const erros = parsed.error.issues.map((issue) => issue.message).join("; ");
  throw new Error(`Erro ao validar variaveis de ambiente: ${erros}`);
}

export const env = {
  ...parsed.data,
  EVOLUTION_ENABLED: Boolean(
    parsed.data.EVOLUTION_API_URL &&
      parsed.data.EVOLUTION_API_KEY &&
      parsed.data.EVOLUTION_INSTANCE,
  ),
};
