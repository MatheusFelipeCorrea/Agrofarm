import { describe, expect, it, vi } from "vitest";

vi.mock("../../services/cotacao/cotacao.service.js", () => ({
  buscarCotacaoDolar: vi.fn(),
}));

const { getCotacaoDolarQueryOptions } = await import("./useCotacaoQueries.js");
const { buscarCotacaoDolar } = await import("../../services/cotacao/cotacao.service.js");

describe("useCotacaoQueries", () => {
  it("monta query options de cotacao do dolar", async () => {
    buscarCotacaoDolar.mockResolvedValue({ valor: 5.5 });

    const options = getCotacaoDolarQueryOptions();
    await options.queryFn();

    expect(options.queryKey).toEqual(["cotacao", "dolar"]);
    expect(buscarCotacaoDolar).toHaveBeenCalledTimes(1);
    expect(options.staleTime).toBe(60_000);
  });
});
