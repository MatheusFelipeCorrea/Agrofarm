import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AgroDataTable,
  AgroDataTableBody,
  AgroDataTableEmpty,
  AgroDataTableHead,
  AgroDataTableRow,
  AgroDataTableTd,
  AgroDataTableTh,
  AgroDataTableViewButton,
  AgroDataTableActions,
} from "../../../components/ui/DataTable/AgroDataTable.jsx";
import AgroDataTableFooter from "../../../components/ui/DataTable/AgroDataTableFooter.jsx";
import DateRangeFilter from "../../../components/ui/DateRangeFilter.jsx";
import { useClientPagination } from "../../../hooks/useClientPagination.js";
import { formatBRL, formatarData } from "../../../utils/formatters.js";
import { filtrarMovimentosPorPeriodo } from "../extratoFiltros.js";
import DashboardExtratoDetalheModal from "./DashboardExtratoDetalheModal.jsx";
import { DASHBOARD_EXTRATO_TABLE_CLASS } from "../dashboardTableUi.js";

/** Itens por página — valor fixo aqui para a paginação do extrato (não usar 10). */
const EXTRATO_ITENS_POR_PAGINA = 9;

const FILTROS = [
  { id: "TODOS", label: "Todos" },
  { id: "LUCRO", label: "Entradas" },
  { id: "GASTO", label: "Saídas" },
];

function MovimentoIcon({ tipo }) {
  const isLucro = tipo === "LUCRO";
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
        isLucro ? "bg-emerald-600" : "bg-red-500"
      }`}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        {isLucro ? <path d="M12 17V7M12 7l-4 4M12 7l4 4" /> : <path d="M12 7v10M12 17l-4-4M12 17l4-4" />}
      </svg>
    </span>
  );
}

function ExtratoSkeleton() {
  return (
    <div className="space-y-2 py-2">
      {Array.from({ length: EXTRATO_ITENS_POR_PAGINA }, (_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

export default function DashboardExtratoSection({ extratoRecente, loading, className = "" }) {
  const itens = extratoRecente ?? [];
  const [filtro, setFiltro] = useState("TODOS");
  const [periodoFrom, setPeriodoFrom] = useState("");
  const [periodoTo, setPeriodoTo] = useState("");
  const [detalheAberto, setDetalheAberto] = useState(false);
  const [movimentoDetalhe, setMovimentoDetalhe] = useState(null);

  const periodoAtivo = Boolean(periodoFrom || periodoTo);

  const itensFiltrados = useMemo(() => {
    let lista = itens;
    if (filtro !== "TODOS") {
      lista = lista.filter((item) => item.tipo === filtro);
    }
    return filtrarMovimentosPorPeriodo(lista, { from: periodoFrom, to: periodoTo });
  }, [itens, filtro, periodoFrom, periodoTo]);

  const pagination = useClientPagination(itensFiltrados, EXTRATO_ITENS_POR_PAGINA);
  const { setPage } = pagination;

  useEffect(() => {
    setPage(1);
  }, [filtro, periodoFrom, periodoTo, setPage]);

  const verMaisDestino =
    filtro === "LUCRO" ? "/lucros" : filtro === "GASTO" ? "/gastos" : null;

  function abrirDetalhe(movimento) {
    setMovimentoDetalhe(movimento);
    setDetalheAberto(true);
  }

  function fecharDetalhe() {
    setDetalheAberto(false);
  }

  useEffect(() => {
    if (!detalheAberto) setMovimentoDetalhe(null);
  }, [detalheAberto]);

  return (
    <>
      <section
        className={`flex h-full min-h-0 min-w-0 flex-col rounded-2xl border border-[var(--agro-card-border)] bg-white p-5 shadow-sm ${className}`.trim()}
        data-testid="dashboard-extrato"
      >
        <div className="shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-slate-800">Extrato recente</h2>
              <p className="mt-0.5 text-sm text-slate-500">Últimas movimentações financeiras</p>
            </div>
            <div className="shrink-0">
              <DateRangeFilter
                from={periodoFrom}
                to={periodoTo}
                onChangeFrom={setPeriodoFrom}
                onChangeTo={setPeriodoTo}
                fromPlaceholder="Início"
                toPlaceholder="Fim"
                compact
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex shrink-0 flex-wrap gap-2">
          {FILTROS.map((chip) => {
            const ativo = filtro === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFiltro(chip.id)}
                className={`inline-flex h-8 shrink-0 items-center rounded-full px-4 text-xs font-semibold transition-colors ${
                  ativo
                    ? "bg-[var(--agro-brand)] text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          {loading ? (
            <>
              <p className="sr-only">Carregando extrato...</p>
              <ExtratoSkeleton />
            </>
          ) : itensFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center">
              <p className="text-sm font-medium text-slate-600">
                {periodoAtivo ? "Nenhuma movimentação no período" : "Sem movimentações recentes"}
              </p>
              <p className="mt-1 max-w-[260px] text-xs text-slate-500">
                {periodoAtivo
                  ? "Ajuste o intervalo de datas no calendário acima."
                  : "Lucros e gastos registrados aparecerão aqui em ordem cronológica."}
              </p>
            </div>
          ) : (
            <AgroDataTable
              embedded
              minWidth={0}
              className={DASHBOARD_EXTRATO_TABLE_CLASS}
              style={{
                "--extrato-rows": Math.max(1, pagination.paginatedItems.length),
              }}
              footer={
                <AgroDataTableFooter
                  className="relative z-[1] shrink-0 gap-2 px-0 py-2 text-xs sm:flex-col sm:items-stretch xl:flex-row xl:items-center xl:justify-between [&_p]:min-w-0 [&_p]:truncate"
                  start={pagination.start}
                  end={pagination.end}
                  totalItems={pagination.totalItems}
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                  itemLabel={pagination.totalItems === 1 ? "movimentação" : "movimentações"}
                />
              }
            >
              <AgroDataTableHead>
                <AgroDataTableTh align="left" className="w-12">
                  <span className="sr-only">Tipo</span>
                </AgroDataTableTh>
                <AgroDataTableTh align="left">Movimentação</AgroDataTableTh>
                <AgroDataTableTh align="left">Data</AgroDataTableTh>
                <AgroDataTableTh align="right">Valor</AgroDataTableTh>
                <AgroDataTableTh align="center" className="w-16">
                  Ações
                </AgroDataTableTh>
              </AgroDataTableHead>

              <AgroDataTableBody>
                {pagination.paginatedItems.length === 0 ? (
                  <AgroDataTableEmpty colSpan={5}>Nenhum registro nesta página.</AgroDataTableEmpty>
                ) : (
                  pagination.paginatedItems.map((movimento) => {
                    const isLucro = movimento.tipo === "LUCRO";
                    const rowKey = movimento.id ?? `${movimento.tipo}-${movimento.data}-${movimento.titulo}`;

                    return (
                      <AgroDataTableRow key={rowKey}>
                        <AgroDataTableTd align="left">
                          <MovimentoIcon tipo={movimento.tipo} />
                        </AgroDataTableTd>
                        <AgroDataTableTd align="left">
                          <p className="font-semibold text-slate-800">
                            {movimento.titulo || movimento.descricao || "Movimentação"}
                          </p>
                          {movimento.fazendaNome ? (
                            <p className="mt-0.5 text-xs text-slate-500">{movimento.fazendaNome}</p>
                          ) : null}
                        </AgroDataTableTd>
                        <AgroDataTableTd align="left" className="whitespace-nowrap text-xs text-slate-600">
                          {formatarData(movimento.criadoEm || movimento.data)}
                        </AgroDataTableTd>
                        <AgroDataTableTd align="right" className="whitespace-nowrap">
                          <span
                            className={`font-bold tabular-nums ${isLucro ? "text-emerald-700" : "text-red-600"}`}
                          >
                            {isLucro ? "+" : "-"}
                            {formatBRL(movimento.valor)}
                          </span>
                        </AgroDataTableTd>
                        <AgroDataTableTd align="center">
                          <AgroDataTableActions>
                            <AgroDataTableViewButton
                              label={`Ver detalhes de ${movimento.titulo || "movimentação"}`}
                              onClick={() => abrirDetalhe(movimento)}
                            />
                          </AgroDataTableActions>
                        </AgroDataTableTd>
                      </AgroDataTableRow>
                    );
                  })
                )}
              </AgroDataTableBody>
            </AgroDataTable>
          )}
        </div>

        {!loading && verMaisDestino && itensFiltrados.length > 0 ? (
          <Link
            to={verMaisDestino}
            className="mt-auto shrink-0 pt-3 text-sm font-semibold text-[var(--agro-brand)] hover:underline"
          >
            Ver extrato completo →
          </Link>
        ) : null}
      </section>

      <DashboardExtratoDetalheModal
        open={detalheAberto}
        onClose={fecharDetalhe}
        movimento={movimentoDetalhe}
      />
    </>
  );
}
