import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { prismaErrorToUserMessage } from "../../shared/utils/prismaUserMessage.js";

describe("prismaErrorToUserMessage", () => {
  it("traduz erro P2002 de duplicidade", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Unique constraint", {
      code: "P2002",
      clientVersion: "5.10.0",
      meta: { target: ["email"] },
    });

    expect(prismaErrorToUserMessage(err)).toContain("duplicado");
    expect(prismaErrorToUserMessage(err)).toContain("email");
  });

  it("traduz erro P2025 de registro nao encontrado", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: "5.10.0",
    });

    expect(prismaErrorToUserMessage(err)).toContain("não encontrado");
  });

  it("traduz PrismaClientValidationError", () => {
    const err = new Prisma.PrismaClientValidationError("Invalid", { clientVersion: "5.10.0" });
    expect(prismaErrorToUserMessage(err)).toContain("Dados inválidos");
  });

  it("traduz P2003 e P2020", () => {
    const p2003 = new Prisma.PrismaClientKnownRequestError("FK", {
      code: "P2003",
      clientVersion: "5.10.0",
    });
    const p2020 = new Prisma.PrismaClientKnownRequestError("Value", {
      code: "P2020",
      clientVersion: "5.10.0",
    });
    expect(prismaErrorToUserMessage(p2003)).toContain("referência");
    expect(prismaErrorToUserMessage(p2020)).toContain("maior do que o permitido");
  });

  it("retorna null para erro desconhecido", () => {
    expect(prismaErrorToUserMessage(new Error("outro"))).toBeNull();
  });
});
