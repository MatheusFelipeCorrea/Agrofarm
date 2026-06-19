import "dotenv/config";
import { execSync } from "node:child_process";
import prisma from "../database/client.js";

async function main() {
  console.log("[db-verify] Verificando migracoes Prisma...");
  try {
    const status = execSync("npx prisma migrate status", { encoding: "utf8" });
    console.log(status);
    if (!/Database schema is up to date/i.test(status)) {
      console.error("[db-verify] ATENCAO: banco pode estar desatualizado em relacao ao schema.");
      process.exitCode = 1;
    } else {
      console.log("[db-verify] Migracoes: OK (schema alinhado com o banco hospedado).");
    }
  } catch (err) {
    console.error("[db-verify] Falha ao checar migrate status:", err.message);
    process.exitCode = 1;
  }

  console.log("[db-verify] Testando conexao e enums criticos...");
  const enums = await prisma.$queryRaw`
    SELECT t.typname AS nome
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e'
    ORDER BY t.typname
  `;

  const esperados = [
    "tipo_notificacao",
    "status_gasto",
    "status_lembrete",
    "status_cultura",
    "tipo_fazenda",
    "origem_lucro",
    "status_historico_mapa",
  ];

  const nomes = new Set(enums.map((e) => e.nome));
  const faltando = esperados.filter((e) => !nomes.has(e));
  if (faltando.length) {
    console.error("[db-verify] Enums ausentes no banco:", faltando.join(", "));
    process.exitCode = 1;
  } else {
    console.log("[db-verify] Enums principais: OK");
  }

  const postgis = await prisma.$queryRaw`
    SELECT PostGIS_Version() AS versao
  `;
  console.log("[db-verify] PostGIS:", postgis[0]?.versao ?? "indisponivel");

  const contagens = await prisma.$queryRaw`
    SELECT
      (SELECT COUNT(*)::int FROM usuarios) AS usuarios,
      (SELECT COUNT(*)::int FROM culturas) AS culturas,
      (SELECT COUNT(*)::int FROM fazendas) AS fazendas
  `;
  console.log("[db-verify] Registros atuais (amostra):", contagens[0]);
  console.log("[db-verify] Concluido.");
}

main()
  .catch((err) => {
    console.error("[db-verify] Erro:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
