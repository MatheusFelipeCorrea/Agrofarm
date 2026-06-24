import { z } from "zod";

const fazendaIdSchema = z.union([z.literal("todas"), z.string().uuid("fazendaId invalido")]);

const cambioParSchema = z.object({
	usd: z.coerce.number().positive("usd deve ser positivo").optional(),
	brl: z.coerce.number().positive("brl deve ser positivo").optional(),
});

export const simulacaoLinhaSchema = z.object({
	culturaId: z.string().uuid("culturaId invalido"),
	cultura: z.string().trim().min(1).max(120).optional(),
	quantidadeSacas: z.coerce.number().positive("quantidadeSacas deve ser positiva"),
	valorSaca: z.coerce.number().positive("valorSaca deve ser positivo"),
	isExportacao: z.boolean().optional().default(true),
	moeda: z.enum(["USD", "EUR", "BRL"]).optional(),
	usd: z.coerce.number().positive("usd deve ser positivo").optional(),
	brl: z.coerce.number().positive("brl deve ser positivo").optional(),
});

export const simulacaoDividasQuerySchema = z.object({
	fazendaId: fazendaIdSchema.optional().default("todas"),
});

export const calcularSacasSchema = z
	.object({
		linhas: z.array(simulacaoLinhaSchema).min(1, "Informe ao menos uma linha de simulação").optional(),
		culturaId: z.string().uuid("culturaId invalido").optional(),
		cultura: z.string().trim().min(1, "cultura obrigatoria").max(120).optional(),
		quantidadeSacas: z.coerce.number().positive("quantidadeSacas deve ser positiva").optional(),
		valorSaca: z.coerce.number().positive("valorSaca deve ser positivo").optional(),
		usd: z.coerce.number().positive("usd deve ser positivo").optional(),
		brl: z.coerce.number().positive("brl deve ser positivo").optional(),
		moeda: z.enum(["USD", "EUR", "BRL"]).optional().default("USD"),
		isExportacao: z.boolean().optional(),
		fazendaId: fazendaIdSchema.optional().default("todas"),
		cambio: z
			.object({
				USD: cambioParSchema.optional(),
				EUR: cambioParSchema.optional(),
			})
			.optional(),
	})
	.refine(
		(body) =>
			(Array.isArray(body.linhas) && body.linhas.length > 0)
			|| (Boolean(body.culturaId || body.cultura) && body.quantidadeSacas != null && body.valorSaca != null),
		{
			message: "Informe linhas ou cultura + quantidadeSacas + valorSaca",
			path: ["linhas"],
		},
	);

export const salvarSimulacaoSchema = z
	.object({
		fazendaId: fazendaIdSchema.optional().default("todas"),
		linhas: z.array(simulacaoLinhaSchema).min(1).optional(),
		culturaId: z.string().uuid("culturaId invalido").optional(),
		quantidadeSacas: z.coerce.number().positive("quantidadeSacas deve ser positiva").optional(),
		valorSaca: z.coerce.number().positive("valorSaca deve ser positivo").optional(),
		moeda: z.enum(["USD", "EUR", "BRL"]).optional(),
		isExportacao: z.boolean().optional(),
		taxaCambioManual: z.coerce.number().positive("taxaCambioManual deve ser positiva").nullable().optional(),
		valorBruto: z.coerce.number().nonnegative("valorBruto invalido").optional(),
		valorLiquido: z.coerce.number().nonnegative("valorLiquido invalido").optional(),
		composicaoTaxas: z.any().optional(),
		abatimentoDivida: z.coerce.number().nonnegative("abatimentoDivida invalido").optional(),
		novoSaldoDivida: z.coerce.number().nonnegative("novoSaldoDivida invalido").optional(),
		cambio: z
			.object({
				USD: cambioParSchema.optional(),
				EUR: cambioParSchema.optional(),
			})
			.optional(),
	})
	.refine(
		(body) =>
			(Array.isArray(body.linhas) && body.linhas.length > 0)
			|| Boolean(body.culturaId && body.quantidadeSacas != null && body.valorSaca != null),
		{
			message: "Informe linhas ou culturaId + quantidadeSacas + valorSaca",
			path: ["linhas"],
		},
	);
