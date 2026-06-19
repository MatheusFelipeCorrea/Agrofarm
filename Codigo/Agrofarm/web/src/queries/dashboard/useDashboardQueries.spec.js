import { describe, expect, it, vi } from "vitest";

vi.mock("../../services/dashboard/dashboard.service.js", () => ({
  buscarDashboard: vi.fn(),
}));

const { getDashboardQueryOptions } = await import("./useDashboardQueries.js");
const { buscarDashboard } = await import("../../services/dashboard/dashboard.service.js");

describe("useDashboardQueries", () => {
  it("monta query options com fazenda selecionada", async () => {
    buscarDashboard.mockResolvedValue({ ok: true });

    const options = getDashboardQueryOptions("faz-1");
    await options.queryFn();

    expect(options.queryKey).toEqual(["dashboard", { fazendaId: "faz-1" }]);
    expect(buscarDashboard).toHaveBeenCalledWith("faz-1");
  });

  it("usa valor 'todas' como fallback", async () => {
    buscarDashboard.mockResolvedValue({ ok: true });

    const options = getDashboardQueryOptions();
    await options.queryFn();

    expect(options.queryKey).toEqual(["dashboard", { fazendaId: "todas" }]);
    expect(buscarDashboard).toHaveBeenCalledWith("todas");
  });
});
