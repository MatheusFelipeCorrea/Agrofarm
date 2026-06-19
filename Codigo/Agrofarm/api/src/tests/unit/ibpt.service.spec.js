import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

vi.mock("axios", () => ({
	default: {
		get: vi.fn(),
	},
}));

vi.mock("../../config/culturaNcm.config.js", async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		resolverNcmCultura: vi.fn(actual.resolverNcmCultura),
	};
});

const { ibptService } = await import("../../services/ibpt.service.js");

describe("ibptService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.IBPT_ENABLED = "true";
		delete process.env.IBPT_TOKEN;
		delete process.env.IBPT_CNPJ;
	});

	it("retorna null quando cultura nao tem NCM mapeado", async () => {
		const resultado = await ibptService.consultarTributosPorCultura({
			cultura: "CulturaInexistenteXYZ",
			valorBruto: 1000,
		});
		expect(resultado).toBeNull();
	});

	it("consulta valraw quando nao ha token oficial", async () => {
		const gzipPayload = {
			tabela: "26.1.H",
			dados: [
				{
					codigo: "12010000",
					descricao: "Soja",
					aliquotaNacionalFederal: 10.45,
					aliquotaImportadosFederal: 12.45,
					aliquotaEstadual: 12,
					aliquotaMunicipal: 0,
				},
			],
		};

		const { gzipSync } = await import("node:zlib");
		const buffer = gzipSync(Buffer.from(JSON.stringify(gzipPayload)));

		axios.get.mockImplementation((url) => {
			if (String(url).includes("/api/meta.json")) {
				return Promise.resolve({ data: { anos: ["2026"] } });
			}
			if (String(url).includes("/api/2026/index.json")) {
				return Promise.resolve({ data: { tabelas: ["26.1.H"] } });
			}
			if (String(url).endsWith("/ncm/MG.json.gz")) {
				return Promise.resolve({ data: buffer });
			}
			return Promise.reject(new Error(`url inesperada: ${url}`));
		});

		const resultado = await ibptService.consultarTributosPorCultura({
			cultura: "Soja",
			valorBruto: 10_000,
		});

		expect(resultado?.fonte).toBe("ibpt-valraw");
		expect(resultado?.ncm).toBe("12010000");
		expect(resultado?.aliquotaNacionalFederal).toBeCloseTo(0.1045);
	});
});
