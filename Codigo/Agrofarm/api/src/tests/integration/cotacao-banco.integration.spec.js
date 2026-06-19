import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../../database/client.js", () => ({
  prisma: {
    cotacoes: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    culturas: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

const axios = (await import("axios")).default;
const { cotacaoService } = await import("../../services/cotacao.service.js");
const { prisma } = await import("../../database/client.js");

describe("Integração: persistência de cotação no banco", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("salva cotação do dólar ao obter da API externa", async () => {
    axios.get.mockResolvedValue({
      data: {
        USDBRL: {
          bid: "5.45",
          pctChange: "0.5",
          create_date: "2026-05-17 14:00:00",
        },
      },
    });
    prisma.cotacoes.create.mockResolvedValue({
      id: "cot-123",
      valor: 5.45,
      fonte: "awesomeapi:USD",
      atualizado_em: new Date("2026-05-17T14:00:00Z"),
    });

    const resultado = await cotacaoService.buscarDolar();

    expect(prisma.cotacoes.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          valor: 5.45,
          fonte: expect.stringContaining("USD"),
        }),
      }),
    );
    expect(resultado.valor).toBe(5.45);
  });

  it("usa cotação do banco quando API externa falha", async () => {
    axios.get.mockRejectedValueOnce(new Error("API offline"));
    prisma.cotacoes.findFirst.mockResolvedValue({
      id: "cot-123",
      valor: "5.40",
      fonte: "awesomeapi:USD",
      atualizado_em: new Date("2026-05-17T12:00:00Z"),
    });

    const resultado = await cotacaoService.buscarDolar();

    expect(resultado.valor).toBe(5.4);
    expect(prisma.cotacoes.create).not.toHaveBeenCalled();
  });

  it("converte valor string do banco para number", async () => {
    axios.get.mockRejectedValueOnce(new Error("API offline"));
    prisma.cotacoes.findFirst.mockResolvedValue({
      id: "cot-123",
      valor: "5.45",
      fonte: "awesomeapi:USD",
      atualizado_em: new Date("2026-05-17T12:00:00Z"),
    });

    const resultado = await cotacaoService.buscarDolar();

    expect(typeof resultado.valor).toBe("number");
    expect(resultado.valor).toBe(5.45);
  });
});
