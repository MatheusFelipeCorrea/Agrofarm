import { prisma } from "../../database/client.js";

export async function resolverNomeTalhao({ nome, cultura_id }) {
  const trimmed = (nome ?? "").trim();
  if (trimmed) return trimmed;
  if (!cultura_id) return null;

  const cultura = await prisma.culturas.findUnique({
    where: { id: cultura_id },
    select: { nome: true },
  });

  return cultura?.nome?.trim() || null;
}
