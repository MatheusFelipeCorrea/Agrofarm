/**
 * Limpa dados de demonstracao mantendo usuarios e culturas (exceto "Cafe 3 Coracoes").
 * Uso: npm run db:reset-demo
 */
import "dotenv/config";
import prisma from "../client.js";

async function removerCulturaCafeTresCoracoes() {
  const alvo = await prisma.culturas.findMany({
    where: {
      OR: [
        { nome: { contains: "3 Cora", mode: "insensitive" } },
        { nome: { contains: "3 cora", mode: "insensitive" } },
        { nome: { contains: "3 Corações", mode: "insensitive" } },
        { nome: { contains: "3 Coracoes", mode: "insensitive" } },
      ],
    },
    select: { id: true, nome: true },
  });

  if (!alvo.length) {
    console.log("[reset] Cultura Cafe 3 Coracoes: nao encontrada (nada a remover).");
    return;
  }

  for (const c of alvo) {
    if (!/3\s*cor/i.test(c.nome)) continue;
    await prisma.$executeRaw`DELETE FROM poligonos_fazenda_historico WHERE cultura_id = ${c.id}::uuid`;
    await prisma.$executeRaw`DELETE FROM poligonos_fazenda WHERE cultura_id = ${c.id}::uuid`;
    await prisma.fazenda_culturas.deleteMany({ where: { cultura_id: c.id } });
    await prisma.simulacoes.deleteMany({ where: { cultura_id: c.id } });
    await prisma.colheitas.deleteMany({ where: { cultura_id: c.id } });
    await prisma.culturas.delete({ where: { id: c.id } });
    console.log(`[reset] Cultura removida: ${c.nome}`);
  }
}

async function truncarDadosDemo() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      notificacoes,
      chat_mensagens,
      chat_sessoes,
      insight_snapshots,
      lembretes,
      simulacoes,
      gastos,
      lucros,
      poligonos_fazenda_historico,
      poligonos_fazenda,
      colheitas,
      insumos_atividades,
      fazenda_culturas,
      usuarios_fazendas,
      fazendas,
      cotacoes
    RESTART IDENTITY CASCADE
  `);
  console.log("[reset] Tabelas de negocio truncadas (usuarios e culturas preservados).");
}

async function main() {
  console.log("[reset] Iniciando limpeza do banco de demonstracao...");
  await truncarDadosDemo();
  await removerCulturaCafeTresCoracoes();
  console.log("[reset] Concluido. Proximo passo: npm run db:seed:mega");
}

main()
  .catch((err) => {
    console.error("[reset] Erro:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
