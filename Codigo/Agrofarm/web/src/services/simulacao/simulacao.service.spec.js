import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const { api } = await import("../api.js");
const {
  buscarDividas,
  calcularSacas,
  buscarCotacaoMoeda,
  buscarHistoricoSimulacoes,
  salvarSimulacao,
  excluirSimulacao,
} = await import("./simulacao.service.js");

describe("simulacao.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buscarDividas usa fazendaId padrão todas", async () => {
    api.get.mockResolvedValue({ data: { data: [{ id: "d1" }] } });

    const resultado = await buscarDividas();

    expect(api.get).toHaveBeenCalledWith("/simulacao/dividas", {
      params: { fazendaId: "todas" },
    });
    expect(resultado).toHaveLength(1);
  });

  it("calcularSacas envia POST e retorna payload", async () => {
    api.post.mockResolvedValue({ data: { data: { sacas: 500 } } });

    const payload = { valorDivida: 10000, precoSaca: 20 };
    const resultado = await calcularSacas(payload);

    expect(api.post).toHaveBeenCalledWith("/simulacao/calcular-sacas", payload);
    expect(resultado.sacas).toBe(500);
  });

  it("buscarCotacaoMoeda usa endpoint de dólar ou euro", async () => {
    api.get.mockResolvedValue({ data: { data: { valor: 5.2 } } });

    await buscarCotacaoMoeda("USD");
    expect(api.get).toHaveBeenCalledWith("/cotacao/dolar");

    await buscarCotacaoMoeda("EUR");
    expect(api.get).toHaveBeenCalledWith("/cotacao/euro");
  });

  it("buscarHistoricoSimulacoes limita limite a 100", async () => {
    api.get.mockResolvedValue({ data: { data: [] } });

    await buscarHistoricoSimulacoes("f1", 200);

    expect(api.get).toHaveBeenCalledWith("/simulacao/historico", {
      params: { fazendaId: "f1", limite: 100 },
    });
  });

  it("salvarSimulacao envia POST", async () => {
    api.post.mockResolvedValue({ data: { data: { id: "s1" } } });

    const payload = { nome: "Sim 1" };
    const resultado = await salvarSimulacao(payload);

    expect(api.post).toHaveBeenCalledWith("/simulacao/salvar", payload);
    expect(resultado.id).toBe("s1");
  });

  it("excluirSimulacao chama DELETE", async () => {
    api.delete.mockResolvedValue({});

    await excluirSimulacao("s1");

    expect(api.delete).toHaveBeenCalledWith("/simulacao/s1");
  });
});
