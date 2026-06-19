import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../database/client.js", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

const { geometryService } = await import("../../services/geometry.service.js");
const { prisma } = await import("../../database/client.js");

const poligonoSimples = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-47.9, -15.8],
        [-47.89, -15.8],
        [-47.89, -15.79],
        [-47.9, -15.79],
        [-47.9, -15.8],
      ],
    ],
  },
};

describe("geometryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calcula area em hectares", () => {
    const area = geometryService.calcularAreaHectares(poligonoSimples);
    expect(area).toBeGreaterThan(0);
    expect(Number.isFinite(area)).toBe(true);
  });

  it("calcula centroide como par lng/lat", () => {
    const centro = geometryService.calcularCentroide(poligonoSimples);
    expect(centro).toHaveLength(2);
    expect(typeof centro[0]).toBe("number");
    expect(typeof centro[1]).toBe("number");
  });

  it("validarGeometria retorna valido quando banco confirma", async () => {
    prisma.$queryRaw.mockResolvedValue([{ valido: true, motivo: null }]);

    const resultado = await geometryService.validarGeometria(poligonoSimples);

    expect(resultado).toEqual({ valido: true, motivo: null });
  });

  it("validarGeometria retorna motivo quando invalido", async () => {
    prisma.$queryRaw.mockResolvedValue([
      { valido: false, motivo: "Self-intersection" },
    ]);

    const resultado = await geometryService.validarGeometria(poligonoSimples);

    expect(resultado.valido).toBe(false);
    expect(resultado.motivo).toBe("Self-intersection");
  });

  it("validarGeometria trata erro do prisma", async () => {
    prisma.$queryRaw.mockRejectedValue(new Error("geojson invalido"));

    const resultado = await geometryService.validarGeometria(poligonoSimples);

    expect(resultado).toEqual({ valido: false, motivo: "geojson invalido" });
  });
});
