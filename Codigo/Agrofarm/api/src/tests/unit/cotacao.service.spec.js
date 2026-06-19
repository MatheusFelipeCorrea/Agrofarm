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
