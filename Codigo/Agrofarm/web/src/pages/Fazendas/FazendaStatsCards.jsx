import { createElement, useMemo } from "react";
import { GridIcon, HomeIcon, LeafIcon, TrendingUpIcon } from "../../components/ui/icons.jsx";
import { useDashboardQuery } from "../../queries/dashboard/useDashboardQueries.js";
import { calcularProdutividadeMedia, formatarProdutividadeMedia } from "../../utils/produtividade.js";

function StatCard({ icon, label, value, sublabel, loading = false }) {
  return (
    <div className="flex flex-1 min-w-[160px] items-center gap-4 rounded-xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50">
        {createElement(icon, { className: "h-6 w-6 text-green-600" })}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {loading ? (
          <span className="mt-1 inline-block h-8 w-20 animate-pulse rounded bg-gray-200" aria-hidden />
        ) : (
          <p className="mt-0.5 text-2xl font-bold tabular-nums leading-tight text-gray-900">{value}</p>
        )}
        <p className="mt-0.5 text-xs text-gray-400">{sublabel}</p>
      </div>
    </div>
  );
}

export default function FazendaStatsCards({ fazendas, culturas }) {
  const { data: dashboardData, isLoading: dashboardCarregando } = useDashboardQuery("todas");

  const stats = useMemo(() => {
    const listaFazendas = Array.isArray(fazendas) ? fazendas : [];
    const listaCulturas = Array.isArray(culturas) ? culturas : [];
    const totalHectares = listaFazendas.reduce((sum, f) => sum + Number(f.hectares ?? 0), 0);
    const producaoPorCultura = Array.isArray(dashboardData?.producaoPorCultura)
      ? dashboardData.producaoPorCultura
      : [];
    const produtividadeMedia = calcularProdutividadeMedia(producaoPorCultura);

    return {
      totalFazendas: listaFazendas.length,
      hectaresTotais: totalHectares.toLocaleString("pt-BR"),
      totalCulturas: listaCulturas.length,
      produtividadeMedia: formatarProdutividadeMedia(produtividadeMedia),
    };
  }, [fazendas, culturas, dashboardData]);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon={HomeIcon}
        label="Fazendas cadastradas"
        value={stats.totalFazendas}
        sublabel="Todas as suas propriedades"
      />
      <StatCard
        icon={GridIcon}
        label="Hectares totais"
        value={`${stats.hectaresTotais} ha`}
        sublabel="Área total cadastrada"
      />
      <StatCard
        icon={LeafIcon}
        label="Culturas cadastradas"
        value={stats.totalCulturas}
        sublabel="No catálogo do sistema"
      />
      <StatCard
        icon={TrendingUpIcon}
        label="Produtividade média"
        value={stats.produtividadeMedia}
        sublabel="Sacas por hectare (todas as fazendas)"
        loading={dashboardCarregando}
      />
    </div>
  );
}
