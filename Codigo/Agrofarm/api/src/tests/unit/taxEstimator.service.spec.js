import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/ibpt.service.js", () => ({
	ibptService: {
		consultarTributosPorCultura: vi.fn(),
	},
}));

const { ibptService } = await import("../../services/ibpt.service.js");
const { taxEstimatorService } = await import("../../services/taxEstimator.service.js");

describe("taxEstimatorService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("monta taxas com IBPT + corretagem e logistica", async () => {
		ibptService.consultarTributosPorCultura.mockResolvedValue({
			ncm: "12010000",
			descricao: "Soja",
			aliquotaNacionalFederal: 0.1,
			aliquotaEstadual: 0.12,
			aliquotaMunicipal: 0,
			uf: "MG",
			fonte: "ibpt-valraw",
			tabela: "26.1.H",
		});

		const resultado = await taxEstimatorService.estimarTaxas({
			cultura: "Soja",
			valorBruto: 10_000,
			quantidadeSacas: 10,
		});

		expect(resultado.fonte).toBe("ibpt-valraw");
		expect(resultado.ncm).toBe("12010000");
		expect(resultado.itens.some((i) => i.nome.includes("IBPT"))).toBe(true);
		expect(resultado.itens.some((i) => i.nome === "Corretagem")).toBe(true);
		expect(resultado.valorTotal).toBeGreaterThan(0);
	});

	it("usa estimativa interna quando IBPT falha", async () => {
		ibptService.consultarTributosPorCultura.mockResolvedValue(null);

		const resultado = await taxEstimatorService.estimarTaxas({
			cultura: "Trigo",
			valorBruto: 10_000,
			quantidadeSacas: 10,
		});

		expect(resultado.fonte).toBe("estimativa-interna");
		expect(resultado.valorTotal).toBe(600);
	});
});
