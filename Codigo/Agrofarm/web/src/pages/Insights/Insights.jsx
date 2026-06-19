import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Lightbulb,
  ShoppingBag,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import MainLayout from "../../layouts/MainLayout.jsx";
import InsightCard from "../../components/insights/InsightCard.jsx";
import InsightFazendaDestaque, {
  InsightFazendaDestaqueIcon,
} from "../../components/insights/InsightFazendaDestaque.jsx";
import InsightFazendaNav from "../../components/insights/InsightFazendaNav.jsx";
import InsightFazendaLinha from "../../components/insights/InsightFazendaLinha.jsx";
import InsightFazendaRodape from "../../components/insights/InsightFazendaRodape.jsx";
import InsightGreetingCard from "../../components/insights/InsightGreetingCard.jsx";
import InsightMarkdown from "../../components/insights/InsightMarkdown.jsx";
import { useAuthStore } from "../../store/authStore.js";
import { useUiStore } from "../../store/uiStore.js";
import {
  INSIGHTS_AUTO_REFRESH_MS,
  useInsightsQuery,
  useRefreshInsightMutation,
} from "../../queries/ia/useIAQueries.js";
import { formatBRL, formatNumberPtBR } from "../../utils/formatters.js";
import { notify } from "../../lib/notify.js";

const CORES_BARRA_PADRAO = ["#8B6914", "#2e5b47", "#ca8a04", "#ea580c", "#6b7280"];

function insightDesatualizado(geradoEm) {
  if (!geradoEm) return true;
  return Date.now() - new Date(geradoEm).getTime() >= INSIGHTS_AUTO_REFRESH_MS;
}

function IconeTendencia({ tendencia }) {
  if (tendencia === "queda") return <TrendingDown className="h-4 w-4 text-red-500" />;
  if (tendencia === "alta") return <TrendingUp className="h-4 w-4 text-emerald-600" />;
  return <BarChart3 className="h-4 w-4 text-gray-500" />;
}

function percentualBarra(valor, referencia) {
  const base = Math.max(Number(valor) || 0, Number(referencia) || 0, 1);
  return Math.min(100, Math.round(((Number(valor) || 0) / base) * 100));
}

function linhasComparativoFazendas(fazendas) {
  if (!fazendas?.length) return [];
  if (fazendas.length === 1) {
    const f = fazendas[0];
    return [
      {
        fazendaId: f.fazendaId,
        fazendaNome: f.fazendaNome,
        destaque: `Saldo do período: ${f.saldo >= 0 ? "positivo" : "negativo"} no consolidado.`,
        tipo: f.saldo >= 0 ? "positivo" : "negativo",
      },
    ];
  }

  const piorPendente = [...fazendas].sort((a, b) => b.totalPendente - a.totalPendente)[0];
  const melhorSaldo = [...fazendas].sort((a, b) => b.saldo - a.saldo)[0];

  const linhas = [];
  if (piorPendente) {
    linhas.push({
      fazendaId: piorPendente.fazendaId,
      fazendaNome: piorPendente.fazendaNome,
      destaque: "Maior volume de pendências financeiras no período analisado.",
      tipo: "negativo",
    });
  }
  if (melhorSaldo && melhorSaldo.fazendaId !== piorPendente?.fazendaId) {
    linhas.push({
      fazendaId: melhorSaldo.fazendaId,
      fazendaNome: melhorSaldo.fazendaNome,
      destaque: "Melhor custo-benefício do período (lucros vs. gastos).",
      tipo: "positivo",
    });
  } else if (melhorSaldo && linhas.length === 1) {
    linhas.push({
      fazendaId: melhorSaldo.fazendaId,
      fazendaNome: melhorSaldo.fazendaNome,
      destaque: "Melhor saldo consolidado entre as fazendas do escopo.",
      tipo: "positivo",
    });
  }

  return linhas.slice(0, 2);
}

export default function Insights() {
  const usuario = useAuthStore((s) => s.usuario);
  const fazendaSelecionada = useAuthStore((s) => s.fazendaSelecionada);
  const requestSidebarCotacoes = useUiStore((s) => s.requestSidebarCotacoes);

  const fazendaId = fazendaSelecionada || "todas";
  const { data, isLoading, isError } = useInsightsQuery(fazendaId);
  const refreshMutation = useRefreshInsightMutation(fazendaId);
  const autoRefreshLock = useRef(false);
  const [indiceFazenda, setIndiceFazenda] = useState(0);
  const [indiceAnalise, setIndiceAnalise] = useState(0);
  const [recsPorFazenda, setRecsPorFazenda] = useState({});

  useEffect(() => {
    if (!data || autoRefreshLock.current) return;

    const precisa =
      (data.estoque?.atualizavel && insightDesatualizado(data.estoque?.geradoEm)) ||
      (data.lucros?.atualizavel && insightDesatualizado(data.lucros?.geradoEm));

    if (!precisa) return;

    autoRefreshLock.current = true;
    (async () => {
      try {
        if (data.estoque?.atualizavel && insightDesatualizado(data.estoque?.geradoEm)) {
          await refreshMutation.mutateAsync("ESTOQUE");
        }
        if (data.lucros?.atualizavel && insightDesatualizado(data.lucros?.geradoEm)) {
          await refreshMutation.mutateAsync("LUCROS");
        }
      } catch {
        /* toast via mutation */
      } finally {
        autoRefreshLock.current = false;
      }
    })();
  }, [data, refreshMutation]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.visibilityState !== "visible" || refreshMutation.isPending) return;
      try {
        await refreshMutation.mutateAsync("ESTOQUE");
        await refreshMutation.mutateAsync("LUCROS");
      } catch {
        /* toast via mutation */
      }
    }, INSIGHTS_AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fazendaId, refreshMutation]);

  useEffect(() => {
    if (isError) {
      notify.error("Não foi possível carregar os insights.", { id: "insights-erro" });
    }
  }, [isError]);

  const estoqueItens = data?.estoque?.dados?.itens ?? [];
  const lucros = data?.lucros?.dados ?? {};
  const fazendasAnalise = data?.analiseFazendas?.dados?.fazendas ?? [];

  const fazendasLista = useMemo(() => {
    const carousel = data?.fazendasCarousel;
    if (carousel?.length) return carousel;

    const fixa = data?.fazendaFixa?.dados?.fazenda;
    if (fixa) {
      return [
        {
          fazendaId: fixa.fazendaId,
          fazendaNome: fixa.fazendaNome ?? data?.fazendaFixa?.dados?.tituloFazenda,
          totalPago: fixa.totalPago,
          totalPendente: fixa.totalPendente,
          estoqueItens: fixa.estoqueItens ?? [],
          recomendacao: data?.fazendaFixa?.recomendacao,
        },
      ];
    }
    return [];
  }, [data]);

  const analisePorFazenda = data?.analisePorFazenda ?? [];

  useEffect(() => {
    setIndiceFazenda(0);
    setIndiceAnalise(0);
    setRecsPorFazenda({});
  }, [fazendaId, fazendasLista, analisePorFazenda]);

  const indiceFazendaSeguro = Math.min(indiceFazenda, Math.max(fazendasLista.length - 1, 0));
  const fazendaAtual = fazendasLista[indiceFazendaSeguro] ?? null;

  const recomendacaoFazendaAtual =
    (fazendaAtual?.fazendaId && recsPorFazenda[fazendaAtual.fazendaId]) ||
    fazendaAtual?.recomendacao ||
    null;

  const linhasFazendas = linhasComparativoFazendas(fazendasAnalise);
  const maxLucro = Math.max(Number(lucros.mesAtual) || 0, Number(lucros.mesAnterior) || 0, 1);

  const totalSlidesAnalise = 1 + fazendasLista.length;
  const indiceAnaliseSeguro = Math.min(indiceAnalise, Math.max(totalSlidesAnalise - 1, 0));
  const visaoGeralAnalise = indiceAnaliseSeguro === 0;
  const analiseFazendaAtual =
    !visaoGeralAnalise && fazendasLista[indiceAnaliseSeguro - 1]
      ? analisePorFazenda.find((a) => a.fazendaId === fazendasLista[indiceAnaliseSeguro - 1].fazendaId)
      : null;

  const recomendacaoAnaliseAtual = visaoGeralAnalise
    ? data?.analiseFazendas?.recomendacao
    : analiseFazendaAtual?.recomendacao;

  async function handleRefreshFazendaAtual() {
    if (!fazendaAtual?.fazendaId) return;
    try {
      const res = await refreshMutation.mutateAsync({
        tipo: "FAZENDA_FIXA",
        fazendaCarouselId: fazendaAtual.fazendaId,
      });
      const card = res?.atualizados?.[0];
      if (card?.recomendacao) {
        setRecsPorFazenda((prev) => ({
          ...prev,
          [fazendaAtual.fazendaId]: card.recomendacao,
        }));
      }
    } catch {
      /* toast via mutation */
    }
  }

  return (
    <MainLayout>
      <div className="flex w-full flex-col gap-5" style={{ paddingTop: "clamp(1.2rem, 3.5vh, 2rem)" }} data-testid="insights-page">
        <header className="space-y-1">
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-gray-900 md:text-[2.15rem]">
            Insights
          </h1>
          <p className="text-[0.95rem] text-gray-500">
            Acompanhe os principais indicadores da sua fazenda.
          </p>
        </header>

        <InsightGreetingCard nome={usuario?.nome} texto={data?.saudacao?.texto} />

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 xl:grid-cols-4">
          <InsightCard
            icon={ShoppingBag}
            titulo="Situação do Estoque"
            card={data?.estoque}
            loading={isLoading || refreshMutation.isPending}
            onRefresh={() => refreshMutation.mutate("ESTOQUE")}
          >
            {isLoading ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : estoqueItens.length === 0 ? (
              <p className="text-sm text-gray-500">{data?.estoque?.texto}</p>
            ) : (
              <div className="space-y-3">
                {estoqueItens.slice(0, 5).map((item, index) => (
                  <div key={item.culturaId ?? item.nome}>
                    <div className="mb-1 flex justify-between text-xs text-gray-600">
                      <span className="font-medium text-gray-800">{item.nome}</span>
                      <span>{formatNumberPtBR(item.emEstoque)} sc</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, item.percentual ?? 0)}%`,
                          backgroundColor: item.cor ?? CORES_BARRA_PADRAO[index % CORES_BARRA_PADRAO.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
                {data?.estoque?.texto ? (
                  <div className="pt-1">
                    <InsightMarkdown content={data.estoque.texto} />
                  </div>
                ) : null}
              </div>
            )}
          </InsightCard>

          <InsightCard
            icon={BarChart3}
            titulo="Desempenho dos Lucros"
            card={data?.lucros}
            loading={isLoading || refreshMutation.isPending}
            onRefresh={() => refreshMutation.mutate("LUCROS")}
          >
            {isLoading ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-1.5 text-sm">
                  <IconeTendencia tendencia={lucros.tendencia} />
                  <span
                    className={
                      lucros.tendencia === "alta"
                        ? "font-semibold text-emerald-700"
                        : lucros.tendencia === "queda"
                          ? "font-semibold text-red-600"
                          : "font-semibold text-gray-700"
                    }
                  >
                    {formatNumberPtBR(Math.abs(lucros.variacaoPercentual ?? 0), { maximumFractionDigits: 0 })}%
                  </span>
                  <span className="text-gray-600">Comparado com o mês passado</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Esse Mês</p>
                  <p className="text-base font-semibold text-gray-900">{formatBRL(lucros.mesAtual)}</p>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all"
                      style={{ width: `${percentualBarra(lucros.mesAtual, maxLucro)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Mês Passado</p>
                  <p className="text-base font-semibold text-gray-700">{formatBRL(lucros.mesAnterior)}</p>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-red-400 transition-all"
                      style={{ width: `${percentualBarra(lucros.mesAnterior, maxLucro)}%` }}
                    />
                  </div>
                </div>
                {data?.lucros?.texto ? (
                  <InsightMarkdown content={data.lucros.texto} />
                ) : null}
              </div>
            )}
          </InsightCard>

          <InsightCard
            icon={Target}
            titulo="Análise das Fazendas"
            card={data?.analiseFazendas}
            headerExtra={
              fazendasLista.length > 0 ? (
                <InsightFazendaNav
                  indice={indiceAnaliseSeguro}
                  total={totalSlidesAnalise}
                  onAnterior={() => setIndiceAnalise((i) => Math.max(0, i - 1))}
                  onProximo={() =>
                    setIndiceAnalise((i) => Math.min(totalSlidesAnalise - 1, i + 1))
                  }
                />
              ) : null
            }
          >
            {isLoading ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : (
              <div className="space-y-4 text-sm text-gray-700">
                {visaoGeralAnalise ? (
                  <>
                    {linhasFazendas.length > 0 ? (
                      linhasFazendas.map((linha) => (
                        <InsightFazendaLinha
                          key={linha.fazendaId}
                          fazendaNome={linha.fazendaNome}
                          destaque={linha.destaque}
                          tipo={linha.tipo}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        {data?.analiseFazendas?.texto ?? "Sem fazendas para comparar."}
                      </p>
                    )}
                  </>
                ) : analiseFazendaAtual ? (
                  <InsightFazendaLinha
                    fazendaNome={analiseFazendaAtual.fazendaNome}
                    destaque={analiseFazendaAtual.destaque}
                    tipo={analiseFazendaAtual.tipo}
                    exibirRodape={false}
                  />
                ) : (
                  <p className="text-sm text-gray-500">Fazenda não encontrada.</p>
                )}

                {recomendacaoAnaliseAtual ? (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#2e5b47]">
                      <Star className="h-3.5 w-3.5 fill-[#2e5b47]/20 text-[#2e5b47]" aria-hidden />
                      Recomendação
                    </p>
                    <InsightMarkdown content={recomendacaoAnaliseAtual} />
                  </div>
                ) : null}

                {!visaoGeralAnalise && analiseFazendaAtual?.fazendaNome ? (
                  <InsightFazendaRodape nome={analiseFazendaAtual.fazendaNome} prefixo="Fazenda" />
                ) : null}
              </div>
            )}
          </InsightCard>

          <InsightCard
            icon={InsightFazendaDestaqueIcon}
            titulo={fazendaAtual?.fazendaNome ?? "Fazenda"}
            card={{ atualizavel: Boolean(fazendaAtual) }}
            loading={refreshMutation.isPending}
            onRefresh={fazendaAtual ? handleRefreshFazendaAtual : undefined}
            headerExtra={
              fazendasLista.length > 1 ? (
                <InsightFazendaNav
                  indice={indiceFazendaSeguro}
                  total={fazendasLista.length}
                  onAnterior={() => setIndiceFazenda((i) => Math.max(0, i - 1))}
                  onProximo={() =>
                    setIndiceFazenda((i) => Math.min(fazendasLista.length - 1, i + 1))
                  }
                />
              ) : null
            }
          >
            {isLoading ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : !fazendaAtual ? (
              <p className="text-sm text-gray-500">Nenhuma fazenda disponível no escopo.</p>
            ) : (
              <InsightFazendaDestaque
                fazenda={fazendaAtual}
                recomendacao={recomendacaoFazendaAtual}
              />
            )}
          </InsightCard>
        </div>

        <section className="flex flex-col gap-4 rounded-2xl border border-[#c5e8d4] bg-[#edf9f1] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2e5b47] text-white">
              <Lightbulb className="h-5 w-5" aria-hidden />
            </span>
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-[#1a4d3c]">Dica do dia</p>
              <InsightMarkdown
                content={
                  data?.dicaDia?.texto ??
                  "Aproveite os preços elevados do café e negocie sua produção para os próximos meses."
                }
                className="mt-1 text-[#2d5a46]"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={requestSidebarCotacoes}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border-2 border-[#2e5b47] bg-transparent px-6 text-sm font-semibold text-[#2e5b47] transition-colors hover:bg-white/60"
          >
            Ver cotações
          </button>
        </section>

        {!data?.geminiDisponivel && !isLoading ? (
          <p className="text-center text-xs text-amber-700">
            IA não configurada (GEMINI_API_KEY_INSIGHTS). Textos interpretativos usam dados do sistema.
          </p>
        ) : null}
      </div>
    </MainLayout>
  );
}
