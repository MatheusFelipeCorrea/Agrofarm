import { createElement, useMemo } from "react";
import { Link } from "react-router-dom";
import CulturaIcon from "../cultura/CulturaIcon.jsx";
import { CalendarIcon, ChevronRightIcon, LayersIcon, PieChartIcon, TrendingUpIcon } from "../ui/icons.jsx";
import Button from "../ui/Button/Button.jsx";
import SoftBadge from "../ui/SoftBadge/SoftBadge.jsx";
import TablePagination from "../ui/TablePagination/TablePagination.jsx";
import {
  AgroDataTable,
  AgroDataTableBody,
  AgroDataTableHead,
  AgroDataTableRow,
  AgroDataTableTd,
  AgroDataTableTh,
} from "../ui/DataTable/AgroDataTable.jsx";
import { CulturaPill } from "../../pages/Fazendas/fazendaListUi.jsx";
import { LEMBRETE_STATUS_TONE } from "../../lib/softBadge.js";
import { PAGE_SIZE_DEFAULT, useClientPagination } from "../../hooks/useClientPagination.js";
import { useHistoricoMapaQuery } from "../../queries/fazenda/useFazendaHistoricoQueries.js";
import { HistoricoMapaStatusBadge } from "../ui/badges/DomainBadges.jsx";

const PAGE_SIZE_FUNCIONARIOS = 2;

function PanelCard({ title, action, footer, children, className = "", stretch = false }) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-sm ${
        stretch ? "h-full min-h-0" : ""
      } ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      <div className={stretch ? "flex min-h-0 flex-1 flex-col px-5 py-4" : "px-5 py-4"}>{children}</div>
      {footer ? <div className="border-t border-gray-100 px-5 py-3">{footer}</div> : null}
    </section>
  );
}

function FooterLink({ to, onClick, children }) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-sm font-medium text-[var(--agro-brand)] transition-colors hover:text-[var(--agro-brand-hover)]"
      >
        {children}
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    );
  }
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-sm font-medium text-[var(--agro-brand)] transition-colors hover:text-[var(--agro-brand-hover)]"
    >
      {children}
      <ChevronRightIcon className="h-4 w-4" />
    </Link>
  );
}

function formatHa(value) {
  return Number(value ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleDateString("pt-BR");
}

function iniciais(nome) {
  const parts = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function ResumoFazendaColuna({ icon, label, valor, unidade, subtexto }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border border-gray-100/80 bg-gray-50/60 px-3 py-3 sm:flex-col sm:items-center sm:border-0 sm:bg-transparent sm:px-2 sm:py-1 sm:text-center">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100/90">
        {createElement(icon, { className: "h-[1.125rem] w-[1.125rem]" })}
      </div>
      <div className="min-w-0 flex-1 sm:w-full">
        <p className="text-xs font-medium leading-snug text-gray-500">{label}</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0 sm:justify-center">
          <span className="text-lg font-bold tabular-nums leading-none text-gray-900">{valor}</span>
          {unidade ? <span className="text-sm font-semibold text-gray-600">{unidade}</span> : null}
        </p>
        {subtexto ? <p className="mt-1 text-xs leading-snug text-gray-500">{subtexto}</p> : null}
      </div>
    </div>
  );
}

export default function FazendaVisaoGeral({
  fazendaId,
  detalhe,
  vinculos = [],
  loading,
  onGerenciarCulturas,
  onVerHistorico,
}) {
  const hectaresMapeados = Number(detalhe?.hectaresMapeados ?? 0);
  const hectaresCulturas = Number(detalhe?.hectares ?? 0);
  const pctUtilizada = Number(detalhe?.percentualAreaUtilizada ?? 0);

  const culturasRows = useMemo(() => {
    return [...vinculos]
      .map((v) => {
        const ha = Number(v.hectares ?? 0);
        const pct = hectaresMapeados > 0 ? Math.min(100, (ha / hectaresMapeados) * 100) : 0;
        return { ...v, ha, pct };
      })
      .sort((a, b) => (a.cultura?.nome ?? "").localeCompare(b.cultura?.nome ?? "", "pt"));
  }, [vinculos, hectaresMapeados]);

  const { data: historicoData, isLoading: historicoCarregando } = useHistoricoMapaQuery(fazendaId, {}, {
    enabled: Boolean(fazendaId),
  });

  const historicoItens = historicoData?.itens ?? [];

  const lembretes = detalhe?.lembretesProximos ?? [];
  const funcionarios = detalhe?.funcionarios ?? [];

  const culturasPag = useClientPagination(culturasRows, PAGE_SIZE_DEFAULT);
  const lembretesPag = useClientPagination(lembretes, PAGE_SIZE_DEFAULT);
  const historicoPag = useClientPagination(historicoItens, PAGE_SIZE_DEFAULT);
  const funcionariosPag = useClientPagination(funcionarios, PAGE_SIZE_FUNCIONARIOS);
  const prodKpi = Number(detalhe?.kpis?.produtividadeMedia ?? 0);
  const prodResumoValor =
    prodKpi > 0 ? prodKpi.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "—";
  const prodResumoUnidade = prodKpi > 0 ? "sc/ha" : null;
  const pctAreaTotal =
    hectaresMapeados > 0
      ? Math.min(100, (hectaresCulturas / hectaresMapeados) * 100)
      : pctUtilizada;

  if (loading) {
    return (
      <div className="flex animate-pulse flex-col gap-4" aria-hidden>
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="h-48 rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <PanelCard
          stretch
          title="Culturas ativas"
          action={
            <Button
              type="button"
              variant="outline"
              className="!h-9 !px-4 !text-xs"
              onClick={onGerenciarCulturas}
            >
              Gerenciar culturas
            </Button>
          }
          footer={
            <p className="text-xs text-gray-500">
              {culturasRows.length} cultura{culturasRows.length === 1 ? "" : "s"} ativa
            </p>
          }
        >
          {culturasRows.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma cultura vinculada a esta fazenda.</p>
          ) : (
            <>
            <AgroDataTable embedded minWidth={240}>
              <AgroDataTableHead>
                <AgroDataTableTh align="left">Cultura</AgroDataTableTh>
                <AgroDataTableTh align="right">Hectares</AgroDataTableTh>
                <AgroDataTableTh align="right">% área</AgroDataTableTh>
              </AgroDataTableHead>
              <AgroDataTableBody>
                {culturasPag.paginatedItems.map((v) => (
                  <AgroDataTableRow key={v.id}>
                    <AgroDataTableTd align="left">
                      <div className="flex items-center gap-2">
                        <CulturaIcon cultura={v.cultura} size="sm" />
                        <span className="font-medium text-gray-900">{v.cultura?.nome ?? "—"}</span>
                      </div>
                    </AgroDataTableTd>
                    <AgroDataTableTd align="right" className="tabular-nums">
                      {formatHa(v.ha)}
                    </AgroDataTableTd>
                    <AgroDataTableTd align="right" className="tabular-nums text-gray-600">
                      {v.pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                    </AgroDataTableTd>
                  </AgroDataTableRow>
                ))}
              </AgroDataTableBody>
            </AgroDataTable>
            <TablePagination
              page={culturasPag.page}
              totalPages={culturasPag.totalPages}
              totalItems={culturasPag.totalItems}
              start={culturasPag.start}
              end={culturasPag.end}
              onPageChange={culturasPag.setPage}
              itemLabel={culturasPag.totalItems === 1 ? "cultura" : "culturas"}
              className="mt-4 border-gray-100"
            />
            </>
          )}
        </PanelCard>

        <PanelCard
          stretch
          title="Próximas atividades"
          footer={<FooterLink to={`/lembretes?fazendaId=${fazendaId}`}>Ver todas as atividades</FooterLink>}
        >
          {lembretes.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma atividade agendada para esta fazenda.</p>
          ) : (
            <>
            <ul className="divide-y divide-gray-100">
              {lembretesPag.paginatedItems.map((l) => {
                const st = LEMBRETE_STATUS_TONE[l.status] ?? LEMBRETE_STATUS_TONE.PENDENTE;
                return (
                  <li key={l.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/80">
                        <CalendarIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{l.titulo}</p>
                        <p className="text-xs text-gray-500">{formatDate(l.data)}</p>
                        {(l.talhao?.nome || l.cultura?.nome) ? (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {l.talhao?.nome ? (
                              <span>
                                Talhão: <span className="font-medium text-gray-700">{l.talhao.nome}</span>
                              </span>
                            ) : null}
                            {l.talhao?.nome && l.cultura?.nome ? " · " : null}
                            {l.cultura?.nome ? (
                              <span className="inline-flex items-center gap-1">
                                Cultura:{" "}
                                <CulturaPill nome={l.cultura.nome} cor={l.cultura.cor} showDot={false} />
                              </span>
                            ) : null}
                            {l.colheita?.ano ? (
                              <span className="text-gray-400">
                                {l.talhao?.nome || l.cultura?.nome ? " · " : ""}
                                Safra {l.colheita.ano}
                              </span>
                            ) : null}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <SoftBadge tone={st.tone} className="shrink-0">
                      {st.label}
                    </SoftBadge>
                  </li>
                );
              })}
            </ul>
            <TablePagination
              page={lembretesPag.page}
              totalPages={lembretesPag.totalPages}
              totalItems={lembretesPag.totalItems}
              start={lembretesPag.start}
              end={lembretesPag.end}
              onPageChange={lembretesPag.setPage}
              itemLabel={lembretesPag.totalItems === 1 ? "atividade" : "atividades"}
              className="mt-4 border-gray-100"
            />
            </>
          )}
        </PanelCard>

        <div className="flex h-full min-h-0 flex-col gap-4">
          <PanelCard title="Resumo da fazenda" className="shrink-0">
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-gray-100">
              <ResumoFazendaColuna
                icon={LayersIcon}
                label="Área total"
                valor={formatHa(hectaresMapeados)}
                unidade="ha"
                subtexto="100% cadastrada"
              />
              <ResumoFazendaColuna
                icon={PieChartIcon}
                label="Área utilizada"
                valor={formatHa(hectaresCulturas)}
                unidade="ha"
                subtexto={`${pctAreaTotal.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do total`}
              />
              <ResumoFazendaColuna
                icon={TrendingUpIcon}
                label="Produtividade média"
                valor={prodResumoValor}
                unidade={prodResumoUnidade}
                subtexto="Todas as culturas"
              />
            </div>
          </PanelCard>

          <PanelCard stretch title="Funcionários vinculados" className="min-h-0 flex-1">
            {funcionarios.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum funcionário vinculado a esta fazenda.</p>
            ) : (
              <>
                <ul className="divide-y divide-gray-100">
                  {funcionariosPag.paginatedItems.map((u) => (
                    <li key={u.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-800 ring-1 ring-inset ring-emerald-200/80">
                        {iniciais(u.nome)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">{u.nome}</p>
                        <p className="text-xs text-gray-500">
                          {u.role === "ADMIN" ? "Administrador" : "Funcionário"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <TablePagination
                  page={funcionariosPag.page}
                  totalPages={funcionariosPag.totalPages}
                  totalItems={funcionariosPag.totalItems}
                  start={funcionariosPag.start}
                  end={funcionariosPag.end}
                  onPageChange={funcionariosPag.setPage}
                  itemLabel={funcionariosPag.totalItems === 1 ? "funcionário" : "funcionários"}
                  className="mt-4 border-gray-100"
                />
              </>
            )}
          </PanelCard>
        </div>
      </div>

      <PanelCard
        title="Últimas áreas no histórico"
        footer={<FooterLink onClick={onVerHistorico}>Ver todas as áreas no histórico</FooterLink>}
      >
        {historicoCarregando ? (
          <p className="text-sm text-gray-500">Carregando histórico…</p>
        ) : historicoItens.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhuma área no histórico. Talhões removidos do mapa aparecerão aqui.
          </p>
        ) : (
          <>
            <AgroDataTable embedded minWidth={640}>
              <AgroDataTableHead>
                <AgroDataTableTh align="left">Talhão</AgroDataTableTh>
                <AgroDataTableTh align="left">Cultura</AgroDataTableTh>
                <AgroDataTableTh>Área (ha)</AgroDataTableTh>
                <AgroDataTableTh>Status</AgroDataTableTh>
                <AgroDataTableTh align="right">Arquivado</AgroDataTableTh>
              </AgroDataTableHead>
              <AgroDataTableBody>
                {historicoPag.paginatedItems.map((h) => (
                  <AgroDataTableRow key={h.id}>
                    <AgroDataTableTd align="left" className="font-medium">
                      {h.nome}
                    </AgroDataTableTd>
                    <AgroDataTableTd align="left">
                      {h.culturaNome ? (
                        <CulturaPill nome={h.culturaNome} cor={h.culturaCor} />
                      ) : (
                        "—"
                      )}
                    </AgroDataTableTd>
                    <AgroDataTableTd className="tabular-nums">{formatHa(h.areaHectares)}</AgroDataTableTd>
                    <AgroDataTableTd>
                      <HistoricoMapaStatusBadge status={h.status} />
                    </AgroDataTableTd>
                    <AgroDataTableTd align="right">{formatDate(h.arquivadoEm)}</AgroDataTableTd>
                  </AgroDataTableRow>
                ))}
              </AgroDataTableBody>
            </AgroDataTable>
            <TablePagination
              page={historicoPag.page}
              totalPages={historicoPag.totalPages}
              totalItems={historicoPag.totalItems}
              start={historicoPag.start}
              end={historicoPag.end}
              onPageChange={historicoPag.setPage}
              itemLabel={historicoPag.totalItems === 1 ? "área" : "áreas"}
              className="mt-4 border-gray-100"
            />
          </>
        )}
      </PanelCard>
    </div>
  );
}
