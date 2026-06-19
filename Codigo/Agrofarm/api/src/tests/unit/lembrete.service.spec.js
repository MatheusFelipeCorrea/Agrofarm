import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppError } from "../../shared/errors/AppError.js";
import { lembreteRepository } from "../../repositories/lembrete.repository.js";
import { lembreteService } from "../../services/lembrete.service.js";
import { whatsappService } from "../../services/whatsapp.service.js";

describe("lembreteService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("deve enviar lembrete e atualizar status para ENVIADO", async () => {
    const lembrete = {
      id: "lembrete-1",
      titulo: "Aplicar fertilizante",
      descricao: "NPK 20-20-20",
      data_lembrete: new Date("2026-04-08T10:00:00.000Z"),
      telefone_whatsapp: "31999998888",
      status: "PENDENTE",
      usuarios: null,
    };

    vi.spyOn(lembreteRepository, "buscarPorId").mockResolvedValue(lembrete);
    vi.spyOn(whatsappService, "enviarTexto").mockResolvedValue({});
    const atualizarSpy = vi
      .spyOn(lembreteRepository, "atualizar")
      .mockResolvedValue({ ...lembrete, status: "ENVIADO" });

    const resultado = await lembreteService.enviarLembrete("lembrete-1");

    expect(whatsappService.enviarTexto).toHaveBeenCalledTimes(1);
    expect(atualizarSpy).toHaveBeenCalledWith("lembrete-1", {
      status: "ENVIADO",
      enviado_em: expect.any(Date),
      erro_envio: null,
    });
    expect(resultado.status).toBe("ENVIADO");
  });

  it("deve falhar ao enviar quando nao houver telefone", async () => {
    const enviarSpy = vi.spyOn(whatsappService, "enviarTexto").mockResolvedValue({});

    vi.spyOn(lembreteRepository, "buscarPorId").mockResolvedValue({
      id: "lembrete-2",
      titulo: "Irrigacao",
      descricao: null,
      data_lembrete: new Date("2026-04-08T10:00:00.000Z"),
      telefone_whatsapp: null,
      status: "PENDENTE",
      usuarios: {
        telefone: null,
      },
    });

    await expect(lembreteService.enviarLembrete("lembrete-2")).rejects.toBeInstanceOf(
      AppError,
    );
    expect(enviarSpy).not.toHaveBeenCalled();
  });
});
