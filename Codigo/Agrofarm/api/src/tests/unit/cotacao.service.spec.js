import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../../database/client.js", () => ({
  prisma: {
    cotacoes: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    culturas: {
      findMany: vi.fn(),
    },
  },
}));

const axios = (await import("axios")).default;
const { cotacaoService } = await import("../../services/cotacao.service.js");
const { cotacaoView } = await import("../../views/cotacao.view.js");
const { prisma } = await import("../../database/client.js");

describe("cotacaoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna cotação da API externa quando disponível", async () => {
    axios.get.mockResolvedValue({
      data: {
        USDBRL: {
          bid: "5.4321",
          pctChange: "0.5",
          create_date: "2026-05-05 10:00:00",
        },
      },
    });

    const resultado = await cotacaoService.buscarDolar();

    expect(resultado).toEqual({
      valor: 5.4321,
      variacao: 0.5,
      fonte: "awesomeapi",
      atualizadoEm: expect.any(String),
    });
    expect(prisma.cotacoes.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          valor: 5.4321,
          fonte: "awesomeapi:USD",
        }),
      }),
    );
    expect(prisma.cotacoes.findFirst).not.toHaveBeenCalled();
  });

  it("usa fallback do banco quando API externa falha", async () => {
    axios.get.mockRejectedValue(new Error("offline"));
    prisma.cotacoes.findFirst.mockResolvedValue({
      valor: 5.4321,
      variacao: null,
      fonte: "seed",
      atualizado_em: new Date("2026-05-05T10:00:00.000Z"),
    });

    const resultado = await cotacaoService.buscarDolar();

    expect(prisma.cotacoes.findFirst).toHaveBeenCalledWith({
      where: { fonte: { contains: ":USD" } },
      orderBy: { atualizado_em: "desc" },
    });
    expect(resultado).toEqual({
      valor: 5.4321,
      variacao: null,
      fonte: "seed",
      atualizadoEm: new Date("2026-05-05T10:00:00.000Z"),
    });
  });

  it("retorna payload nulo quando API e banco não têm cotação", async () => {
    axios.get.mockRejectedValue(new Error("offline"));
    prisma.cotacoes.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const resultado = await cotacaoService.buscarDolar();

    expect(resultado).toEqual({
      valor: null,
      variacao: null,
      fonte: null,
      atualizadoEm: null,
    });
  });
});

describe("cotacaoView", () => {
  it("normaliza cotação com valores numéricos", () => {
    const resultado = cotacaoView.renderDolar({
      valor: "5.77",
      variacao: null,
      fonte: "api",
      atualizado_em: new Date("2026-05-05T09:00:00.000Z"),
    });

    expect(resultado).toEqual({
      valor: 5.77,
      variacao: null,
      fonte: "api",
      atualizadoEm: new Date("2026-05-05T09:00:00.000Z"),
    });
  });
});

describe("cotacaoService.buscarEuro", () => {
  it("retorna cotação do euro via API externa", async () => {
    axios.get.mockResolvedValue({
      data: {
        EURBRL: {
          bid: "6.1234",
          pctChange: "-0.2",
          create_date: "2026-05-05 10:00:00",
        },
      },
    });

    const resultado = await cotacaoService.buscarEuro();

    expect(resultado.valor).toBe(6.1234);
    expect(resultado.fonte).toBe("awesomeapi");
    expect(prisma.cotacoes.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fonte: "awesomeapi:EUR" }),
      }),
    );
  });
});

describe("cotacaoService.buscarCommodities", () => {
  it("mapeia culturas cadastradas e busca cotações no Yahoo", async () => {
    prisma.culturas.findMany.mockResolvedValue([{ nome: "Soja" }, { nome: "Milho" }]);
    axios.get.mockImplementation((url) => {
      if (String(url).includes("yahoo")) {
        return Promise.resolve({
          data: {
            chart: {
              result: [
                {
                  meta: { regularMarketTime: 1715000000 },
                  indicators: { quote: [{ close: [null, 1200, 1250] }] },
                },
              ],
            },
          },
        });
      }
      return Promise.reject(new Error("unexpected"));
    });

    const commodities = await cotacaoService.buscarCommodities();

    expect(commodities.length).toBeGreaterThanOrEqual(2);
    const soja = commodities.find((c) => c.id === "soja");
    expect(soja?.valor).toBe(12.5);
    expect(soja?.fonte).toBe("yahoo-finance");
  });

  it("usa commodities padrão quando não há culturas cadastradas", async () => {
    prisma.culturas.findMany.mockResolvedValue([]);
    axios.get.mockResolvedValue({
      data: {
        chart: {
          result: [
            {
              meta: { regularMarketTime: 1715000000 },
              indicators: { quote: [{ close: [1100] }] },
            },
          ],
        },
      },
    });

    const commodities = await cotacaoService.buscarCommodities();
    const ids = commodities.map((c) => c.id);

    expect(ids).toEqual(expect.arrayContaining(["soja", "milho", "cafe"]));
  });
});

describe("cotacaoService.buscarPainelMercado", () => {
  it("agrega dólar, euro e commodities", async () => {
    axios.get.mockImplementation((url) => {
      const u = String(url);
      if (u.includes("USD-BRL")) {
        return Promise.resolve({
          data: { USDBRL: { bid: "5.50", pctChange: "0.1", create_date: "2026-05-05 10:00:00" } },
        });
      }
      if (u.includes("EUR-BRL")) {
        return Promise.resolve({
          data: { EURBRL: { bid: "6.00", pctChange: "0", create_date: "2026-05-05 10:00:00" } },
        });
      }
      if (u.includes("yahoo")) {
        return Promise.resolve({
          data: {
            chart: {
              result: [
                {
                  meta: { regularMarketTime: 1715000000 },
                  indicators: { quote: [{ close: [1000] }] },
                },
              ],
            },
          },
        });
      }
      return Promise.reject(new Error("offline"));
    });
    prisma.culturas.findMany.mockResolvedValue([{ nome: "Soja" }]);

    const painel = await cotacaoService.buscarPainelMercado();

    expect(painel.dolar.valor).toBe(5.5);
    expect(painel.euro.valor).toBe(6);
    expect(painel.commodities.length).toBeGreaterThan(0);
  });
});
