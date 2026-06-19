import { AppError } from "../shared/errors/AppError.js";
import { dashboardRepository } from "../repositories/dashboard.repository.js";
import { cotacaoService } from "./cotacao.service.js";
import { dashboardView } from "../views/dashboard.view.js";
import { insightsService } from "./insights.service.js";

/** Itens suficientes para preencher o card com scroll quando necessário */
const LIMITE_EXTRATO = 24;

function calcularProdutividade(producaoPorCultura) {
  // Produtividade já é calculada no repositório (sacas / area)
  // Aqui só precisamos garantir que está com valores numéricos corretos
  return producaoPorCultura.map((item) => ({
    ...item,
    produtividade: Number((item.produtividade ?? 0).toFixed(2)),
  }));
}

async function resolverEscopo(usuario, fazendaId) {
  const fazendasVisiveis = await dashboardRepository.listarFazendasVisiveis(usuario);
  const fazendaIdsVisiveis = fazendasVisiveis.map((fazenda) => fazenda.id);

  if (fazendaId === "todas") {
    return fazendaIdsVisiveis;
  }

  if (!fazendaIdsVisiveis.includes(fazendaId)) {
    if (usuario.role === "ADMIN") {
      throw new AppError("Fazenda não encontrada", 404);
    }
    throw new AppError("Acesso negado a esta fazenda", 403);
  }

  return [fazendaId];
}

export const dashboardService = {
  obterDados: async ({ usuario, filtro }) => {
    const fazendaIds = await resolverEscopo(usuario, filtro.fazendaId);

    const [producaoRaw, estoqueRaw, extratoRecente, lucroTotal, custosTotais, cotacaoAtual, recomendacao] =
      await Promise.all([
      dashboardRepository.producaoPorCultura({ fazendaIds }),
      dashboardRepository.estoquePorCultura({ fazendaIds }),
      dashboardRepository.extratoRecente({ fazendaIds, limite: LIMITE_EXTRATO }),
      dashboardRepository.totalLucros({ fazendaIds }),
      dashboardRepository.totalGastos({ fazendaIds }),
      cotacaoService.buscarDolar().catch(() => null),
      insightsService
        .obterRecomendacaoDashboard({ usuario, fazendaId: filtro.fazendaId })
        .catch(() => ({ texto: "Sem recomendações no momento.", origem: "dados" })),
    ]);

    const producaoPorCultura = calcularProdutividade(producaoRaw)
      .sort((a, b) => Number(b.produtividade ?? 0) - Number(a.produtividade ?? 0));

    const sacasEmEstoque = [...estoqueRaw].sort((a, b) => Number(b.peso ?? 0) - Number(a.peso ?? 0));

    return dashboardView.render({
      recomendacao,
      producaoPorCultura,
      sacasEmEstoque,
      extratoRecente,
      cards: {
        saldoTotal: Number(lucroTotal ?? 0) - Number(custosTotais ?? 0),
        cotacaoAtual,
        lucroTotal: Number(lucroTotal ?? 0),
        custosTotais: Number(custosTotais ?? 0),
      },
    });
  },
};