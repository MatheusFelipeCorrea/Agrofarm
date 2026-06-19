import MainLayout from "../../layouts/MainLayout.jsx";
import { useDashboardQuery } from "../../queries/dashboard/useDashboardQueries.js";
import { useCotacaoDolarQuery } from "../../queries/cotacao/useCotacaoQueries.js";
import { useAuthStore } from "../../store/authStore.js";
import DashboardCards from "./components/DashboardCards.jsx";
import DashboardProducaoSection from "./components/DashboardProducaoSection.jsx";
import DashboardExtratoSection from "./components/DashboardExtratoSection.jsx";
import DashboardEstoqueSection from "./components/DashboardEstoqueSection.jsx";

function normalizarDadosDashboard(data) {
  return {
    recomendacao: data?.recomendacao ?? null,
    producaoPorCultura: Array.isArray(data?.producaoPorCultura) ? data.producaoPorCultura : [],
    sacasEmEstoque: Array.isArray(data?.sacasEmEstoque) ? data.sacasEmEstoque : [],
    extratoRecente: Array.isArray(data?.extratoRecente) ? data.extratoRecente : [],
    cards: {
      saldoTotal: Number(data?.cards?.saldoTotal ?? 0),
      lucroTotal: Number(data?.cards?.lucroTotal ?? 0),
      custosTotais: Number(data?.cards?.custosTotais ?? 0),
      cotacaoAtual: data?.cards?.cotacaoAtual ?? null,
    },
  };
}

function IconInfo() {
  return (
    <svg className="h-5 w-5 text-[#7c6a2b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DashboardContent({ dashboardData, cotacaoData, isLoadingDashboard, isLoadingCotacao }) {
  const data = normalizarDadosDashboard(dashboardData);
  const recomendacaoTexto =
    (typeof data.recomendacao === "string" ? data.recomendacao : data.recomendacao?.texto) ||
    "Sem recomendações no momento.";
  const recomendacaoEscopo =
    typeof data.recomendacao === "object" ? data.recomendacao?.escopoLabel : null;

  return (
    <div className="flex w-full flex-col gap-4" data-testid="dashboard-page">
      <section className="rounded-xl border border-[#ebddb0] bg-[#f8efcc] px-4 py-3" data-testid="dashboard-recomendacao">
        <div className="flex items-start gap-3">
          <IconInfo />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#6a5924]">
              Recomendação{recomendacaoEscopo ? ` — ${recomendacaoEscopo}` : ""}:
            </p>
            <p className="text-sm text-[#685d32]">
              {isLoadingDashboard ? "Carregando recomendação…" : recomendacaoTexto}
            </p>
          </div>
        </div>
      </section>

      <DashboardCards
        cards={data.cards}
        cotacaoAtual={cotacaoData || data.cards.cotacaoAtual}
        loadingCards={isLoadingDashboard}
        loadingCotacao={isLoadingCotacao}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] xl:items-stretch">
        <div className="flex flex-col gap-3">
          <DashboardProducaoSection producaoPorCultura={data.producaoPorCultura} loading={isLoadingDashboard} />
          <DashboardEstoqueSection sacasEmEstoque={data.sacasEmEstoque} loading={isLoadingDashboard} />
        </div>

        <div className="flex min-h-0 min-w-0">
          <DashboardExtratoSection
            className="h-full w-full"
            extratoRecente={data.extratoRecente}
            loading={isLoadingDashboard}
          />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const fazendaSelecionada = useAuthStore((state) => state.fazendaSelecionada);

  const { data: dashboardData, isLoading: isLoadingDashboard } = useDashboardQuery(fazendaSelecionada);
  const { data: cotacaoData, isLoading: isLoadingCotacao } = useCotacaoDolarQuery();

  return (
    <MainLayout>
      <DashboardContent
        dashboardData={dashboardData}
        cotacaoData={cotacaoData}
        isLoadingDashboard={isLoadingDashboard}
        isLoadingCotacao={isLoadingCotacao}
      />
    </MainLayout>
  );
}
