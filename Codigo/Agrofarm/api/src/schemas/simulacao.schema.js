import { z } from "zod";

const fazendaIdSchema = z.union([z.literal("todas"), z.string().uuid("fazendaId invalido")]);

export const simulacaoDividasQuerySchema = z.object({
	fazendaId: fazendaIdSchema.optional().default("todas"),
});

export const calcularSacasSchema = z
	.object({
		culturaId: z.string().uuid("culturaId invalido").optional(),
		cultura: z.string().trim().min(1, "cultura obrigatoria").max(120).optional(),
		quantidadeSacas: z.coerce.number().positive("quantidadeSacas deve ser positiva"),
		valorSaca: z.coerce.number().positive("valorSaca deve ser positivo"),
		usd: z.coerce.number().positive("usd deve ser positivo").optional(),
		brl: z.coerce.number().positive("brl deve ser positivo").optional(),
		moeda: z.enum(["USD", "EUR", "BRL"]).optional().default("USD"),
		isExportacao: z.boolean().optional(),
		fazendaId: fazendaIdSchema.optional().default("todas"),
	})
	.refine((body) => Boolean(body.culturaId || body.cultura), {
		message: "Informe culturaId ou cultura",
		path: ["culturaId"],
	});

export const salvarSimulacaoSchema = z.object({
	fazendaId: fazendaIdSchema.optional().default("todas"),
	culturaId: z.string().uuid("culturaId invalido"),
	quantidadeSacas: z.coerce.number().positive("quantidadeSacas deve ser positiva"),
	valorSaca: z.coerce.number().positive("valorSaca deve ser positivo"),
	moeda: z.enum(["USD", "EUR", "BRL"]),
	isExportacao: z.boolean().optional(),
	taxaCambioManual: z.coerce.number().positive("taxaCambioManual deve ser positiva").nullable().optional(),
	valorBruto: z.coerce.number().nonnegative("valorBruto invalido"),
	valorLiquido: z.coerce.number().nonnegative("valorLiquido invalido"),
	composicaoTaxas: z.any().optional(),
	abatimentoDivida: z.coerce.number().nonnegative("abatimentoDivida invalido"),
	novoSaldoDivida: z.coerce.number().nonnegative("novoSaldoDivida invalido"),
});

