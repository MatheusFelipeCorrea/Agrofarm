import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout.jsx";
import { notify } from "../../lib/notify.js";
import { useAuthStore } from "../../store/authStore.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { formatNumberPtBR } from "../../utils/formatters.js";
import Select from "../../components/ui/Select/Select.jsx";
import { listarCulturas } from "../../services/cultura/cultura.service.js";
import { listarFazendas } from "../../services/fazenda/fazenda.service.js";
import { useColheitaListQuery } from "../../queries/colheita/useColheitaQueries.js";
import {
  useConfirmarEntregaArrendamentoMutation,
  useEstoqueListQuery,
  useMarcarEntregaArrendamentoMutation,
} from "../../queries/estoque/useEstoqueQueries.js";
import { FilterIcon, HandshakeIcon, SearchIcon } from "../../components/ui/icons.jsx";
import EstoqueSummaryCards from "../../components/estoque/EstoqueSummaryCards.jsx";
import EstoqueArrendamentoPanel from "../../components/estoque/EstoqueArrendamentoPanel.jsx";
import AgroDataTableFooter from "../../components/ui/DataTable/AgroDataTableFooter.jsx";
import {
  AgroDataTable,
  AgroDataTableActions,
  AgroDataTableBody,
  AgroDataTableEmpty,
  AgroDataTableHead,
  AgroDataTableRow,
  AgroDataTableTd,
  AgroDataTableTh,
  AgroDataTableViewButton,
} from "../../components/ui/DataTable/AgroDataTable.jsx";
import EstoqueDetalheModal from "../../components/estoque/EstoqueDetalheModal.jsx";
import CulturaIcon from "../../components/cultura/CulturaIcon.jsx";
import { EstoqueStatusBadge } from "../../components/ui/badges/DomainBadges.jsx";

const PAGE_SIZE = 5;
const SELECT_CLS =
  "h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:border-[#2e5b47] focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20";

const makeEmptyFilters = (isAdmin) => ({
  fazendaId: isAdmin ? "all" : "",
  culturaId: "",
  colheitaId: "",
  busca: "",
});

function colheitaLabel(c) {
  const cultura = c.cultura?.nome ?? "Cultura";
  const fazenda = c.fazenda?.nome ?? "";
  return `${cultura} — ${c.ano}${fazenda ? ` (${fazenda})` : ""}`;
}

function MovimentacoesRecentes({ items }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((m) => (
        <article
          key={m.id}
          className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-[#2e5b47]">
            <HandshakeIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {m.tipo === "ARRENDAMENTO" ? "Arrendamento" : "Venda"}
            </p>
            <p className="truncate text-xs text-gray-500">
              {m.lote} · {m.fazendaNome}
            </p>
            <p className="text-xs text-gray-400">{m.dataHora ?? m.data}</p>
            <p className="mt-1 text-sm font-semibold text-green-700">
              {formatNumberPtBR(m.quantidadeSacas)} sacas
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Estoque() {
  const [searchParams] = useSearchParams();
  const usuario = useAuthStore((s) => s.usuario);
  const isAdmin = usuario?.role === "ADMIN";
  const focoArrendamento = searchParams.get("pendenteArrendamento") === "1";

  const [fazendas, setFazendas] = useState([]);
  const [culturas, setCulturas] = useState([]);
  const [draftFilters, setDraftFilters] = useState(() => makeEmptyFilters(isAdmin));
  const [appliedFilters, setAppliedFilters] = useState(() => makeEmptyFilters(isAdmin));
  const [filtersDirty, setFiltersDirty] = useState(false);
  const [page, setPage] = useState(1);
  const [detalheAberto, setDetalheAberto] = useState(null);
  const [entregaBusyId, setEntregaBusyId] = useState(null);

  const confirmarEntregaMutation = useConfirmarEntregaArrendamentoMutation();
  const marcarEntregaMutation = useMarcarEntregaArrendamentoMutation();

  const { data: colheitas = [] } = useColheitaListQuery({});

  const queryFilters = useMemo(() => {
    const cleaned = { ...appliedFilters, page, pageSize: PAGE_SIZE };
    if (!isAdmin) delete cleaned.fazendaId;
    if (isAdmin && cleaned.fazendaId === "all") delete cleaned.fazendaId;
    if (!cleaned.culturaId) delete cleaned.culturaId;
    if (!cleaned.colheitaId) delete cleaned.colheitaId;
    if (!cleaned.busca) delete cleaned.busca;
    return cleaned;
  }, [appliedFilters, isAdmin, page]);

  const { data, isError, error, isLoading } = useEstoqueListQuery(queryFilters);

  const lotesQueryFilters = useMemo(
    () => ({ ...(isAdmin ? { fazendaId: "all" } : {}), page: 1, pageSize: 100 }),
    [isAdmin],
  );
  const { data: lotesData } = useEstoqueListQuery(lotesQueryFilters, { enabled: isAdmin });

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 };
  const resumo = data?.resumo ?? { totalEmEstoque: 0, totalVendido: 0, lotesEstoqueBaixo: 0 };
  const movimentacoesRecentes = data?.movimentacoesRecentes ?? [];
  const arrendamentosPendentes = data?.arrendamentosPendentes ?? [];
  const lotesEstoque = lotesData?.items ?? [];

  const defaultFilters = useMemo(() => makeEmptyFilters(isAdmin), [isAdmin]);

  useEffect(() => {
    setDraftFilters(makeEmptyFilters(isAdmin));
    setAppliedFilters(makeEmptyFilters(isAdmin));
    setFiltersDirty(false);
    setPage(1);
  }, [isAdmin]);

  useEffect(() => {
    if (!isError || !error) return;
    notify.error(getApiErrorMessage(error, "Não foi possível carregar o estoque."), { id: "estoque-lista" });
  }, [isError, error]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [faz, cult] = await Promise.all([listarFazendas(), listarCulturas()]);
        if (!active) return;
        const fazendasUsuario = isAdmin
          ? (Array.isArray(faz) ? faz : [])
          : (Array.isArray(faz) ? faz : []).filter((f) =>
              (usuario?.fazendasVinculadas ?? []).some((v) => v.id === f.id),
            );
        setFazendas(fazendasUsuario);
        setCulturas(Array.isArray(cult) ? cult : []);
      } catch (err) {
        notify.error(getApiErrorMessage(err, "Não foi possível carregar dados de apoio."));
      }
    })();
    return () => {
      active = false;
    };
  }, [isAdmin, usuario?.fazendasVinculadas]);

  const colheitasFiltradas = useMemo(() => {
    let lista = Array.isArray(colheitas) ? colheitas : [];
    if (draftFilters.fazendaId && draftFilters.fazendaId !== "all") {
      lista = lista.filter((c) => c.fazendaId === draftFilters.fazendaId);
    }
    if (draftFilters.culturaId) {
      lista = lista.filter((c) => c.culturaId === draftFilters.culturaId);
    }
    return lista;
  }, [colheitas, draftFilters.fazendaId, draftFilters.culturaId]);

  const draftSignature = JSON.stringify(draftFilters);
  const appliedSignature = JSON.stringify(appliedFilters);
  const defaultSignature = JSON.stringify(defaultFilters);
  const hasApplied = appliedSignature !== defaultSignature;
  const canClear = hasApplied && draftSignature === appliedSignature;

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setFiltersDirty(false);
    setPage(1);
  };

  const handleClearFilters = () => {
    const empty = makeEmptyFilters(isAdmin);
    setDraftFilters(empty);
    setAppliedFilters(empty);
    setFiltersDirty(false);
    setPage(1);
  };

  const handleFilterCta = () => {
    if (canClear) {
      handleClearFilters();
      return;
    }
    handleApplyFilters();
  };

  const start = meta.totalItems ? (meta.page - 1) * meta.pageSize + 1 : 0;
  const end = meta.totalItems ? Math.min(meta.page * meta.pageSize, meta.totalItems) : 0;

  async function handleConfirmarEntrega({ entregaId, colheitaId }) {
    setEntregaBusyId(entregaId);
    try {
      await confirmarEntregaMutation.mutateAsync({ entregaId, colheitaId });
      notify.success("Saída de arrendamento registrada no estoque.");
    } catch {
      /* toast via mutation */
    } finally {
      setEntregaBusyId(null);
    }
  }

  async function handleMarcarNaoEntregue(entregaId) {
    setEntregaBusyId(entregaId);
    try {
      await marcarEntregaMutation.mutateAsync({ entregaId, status: "NAO_ENTREGUE" });
      notify.success("Entrega marcada como não realizada.");
    } catch {
      /* toast via mutation */
    } finally {
      setEntregaBusyId(null);
    }
  }

  return (
    <MainLayout>
      <EstoqueDetalheModal
        open={Boolean(detalheAberto)}
        colheitaId={detalheAberto?.colheitaId}
        lotePreview={detalheAberto?.lote}
        onClose={() => setDetalheAberto(null)}
      />

      <div className="flex w-full flex-col gap-5" style={{ paddingTop: "clamp(1.2rem, 3.5vh, 2rem)" }}>
        <header className="space-y-1">
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-gray-900 md:text-[2.15rem]">
            Estoque de Sacas
          </h1>
          <p className="text-[0.95rem] text-gray-500">
            Controle o estoque de sacas de cada colheita e acompanhe o saldo disponível.
          </p>
        </header>

        {focoArrendamento && isAdmin ? (
          <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-900">
            <p className="font-semibold">Confirme as entregas de arrendamento pendentes</p>
            <p className="mt-1 text-violet-800/90">
              Selecione o lote de origem e confirme a saída das sacas do estoque. A notificação só desaparece após
              essa confirmação.
            </p>
          </div>
        ) : null}

        <EstoqueArrendamentoPanel
          entregas={arrendamentosPendentes}
          lotesEstoque={lotesEstoque}
          isAdmin={isAdmin}
          busyId={entregaBusyId}
          onConfirmar={handleConfirmarEntrega}
          onMarcarNaoEntregue={handleMarcarNaoEntregue}
        />

        <section className="flex flex-wrap items-end gap-3">
          {isAdmin ? (
            <FilterField label="Fazenda">
              <Select
                value={draftFilters.fazendaId}
                onChange={(e) => {
                  setDraftFilters((p) => ({ ...p, fazendaId: e.target.value, colheitaId: "" }));
                  setFiltersDirty(true);
                }}
                wrapperClassName="relative w-full"
                selectClassName={SELECT_CLS}
              >
                <option value="all">Todas as fazendas</option>
                {fazendas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </Select>
            </FilterField>
          ) : null}

          <FilterField label="Cultura">
            <Select
              value={draftFilters.culturaId}
              onChange={(e) => {
                setDraftFilters((p) => ({ ...p, culturaId: e.target.value, colheitaId: "" }));
                setFiltersDirty(true);
              }}
              wrapperClassName="relative w-full"
              selectClassName={SELECT_CLS}
            >
              <option value="">Todas as culturas</option>
              {culturas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </FilterField>

          <FilterField label="Safra / Colheita">
            <Select
              value={draftFilters.colheitaId}
              onChange={(e) => {
                setDraftFilters((p) => ({ ...p, colheitaId: e.target.value }));
                setFiltersDirty(true);
              }}
              wrapperClassName="relative w-full"
              selectClassName={SELECT_CLS}
            >
              <option value="">Todas</option>
              {colheitasFiltradas.map((c) => (
                <option key={c.id} value={c.id}>
                  {colheitaLabel(c)}
                </option>
              ))}
            </Select>
          </FilterField>

          <FilterField label="Buscar" className="min-w-[14rem] flex-[1.4]">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={draftFilters.busca}
                onChange={(e) => {
                  setDraftFilters((p) => ({ ...p, busca: e.target.value }));
                  setFiltersDirty(true);
                }}
                placeholder="Buscar lote, fazenda ou cultura..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 shadow-sm transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-[#2e5b47] focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20"
              />
            </div>
          </FilterField>

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2e5b47] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#254a3a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2e5b47] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleFilterCta}
            disabled={!hasApplied && !filtersDirty}
          >
            <FilterIcon className="h-3.5 w-3.5 shrink-0" />
            {canClear ? "Limpar filtros" : "Filtrar"}
          </button>
        </section>

        <EstoqueSummaryCards resumo={resumo} />

        <AgroDataTable
          minWidth={1100}
          loading={isLoading}
          loadingMessage="Carregando estoque..."
          footer={
            <AgroDataTableFooter
              start={start}
              end={end}
              totalItems={meta.totalItems}
              itemLabel={meta.totalItems === 1 ? "lote" : "lotes"}
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          }
        >
          <AgroDataTableHead>
            <AgroDataTableTh align="left">Lote / Colheita</AgroDataTableTh>
            <AgroDataTableTh align="left">Fazenda</AgroDataTableTh>
            <AgroDataTableTh align="left">Cultura</AgroDataTableTh>
            <AgroDataTableTh>Produzidas</AgroDataTableTh>
            <AgroDataTableTh>Vendidas</AgroDataTableTh>
            <AgroDataTableTh>Em estoque</AgroDataTableTh>
            <AgroDataTableTh align="left">Localização</AgroDataTableTh>
            <AgroDataTableTh align="left">Última movimentação</AgroDataTableTh>
            <AgroDataTableTh>Status</AgroDataTableTh>
            <AgroDataTableTh align="center">Ações</AgroDataTableTh>
          </AgroDataTableHead>

          <AgroDataTableBody>
            {!isLoading && items.length === 0 ? (
              <AgroDataTableEmpty colSpan={10}>
                Nenhum lote encontrado para os filtros selecionados.
              </AgroDataTableEmpty>
            ) : (
              items.map((row) => {
                const estoqueBaixo = row.status === "ESTOQUE_BAIXO";
                return (
                  <AgroDataTableRow key={row.colheitaId}>
                    <AgroDataTableTd align="left" className="font-semibold text-gray-800">
                      {row.lote}
                    </AgroDataTableTd>
                    <AgroDataTableTd align="left">{row.fazenda?.nome ?? "—"}</AgroDataTableTd>
                    <AgroDataTableTd align="left">
                      <CulturaCell cultura={row.cultura} />
                    </AgroDataTableTd>
                    <AgroDataTableTd className="text-gray-700">
                      {formatNumberPtBR(row.produzidas)} sacas
                    </AgroDataTableTd>
                    <AgroDataTableTd className="text-gray-700">
                      {formatNumberPtBR(row.vendidas)} sacas
                    </AgroDataTableTd>
                    <AgroDataTableTd
                      className={`font-semibold ${estoqueBaixo ? "text-amber-600" : "text-green-700"}`}
                    >
                      {formatNumberPtBR(row.emEstoque)} sacas
                    </AgroDataTableTd>
                    <AgroDataTableTd align="left" className="text-gray-600">
                      {row.localizacao ?? "—"}
                    </AgroDataTableTd>
                    <AgroDataTableTd align="left" className="text-gray-600">
                      {row.ultimaMovimentacao ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-gray-500">{row.ultimaMovimentacao.data}</span>
                          <span className="text-sm">{row.ultimaMovimentacao.descricao}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </AgroDataTableTd>
                    <AgroDataTableTd>
                      <div className="flex justify-center">
                        <EstoqueStatusBadge status={row.status} />
                      </div>
                    </AgroDataTableTd>
                    <AgroDataTableTd>
                      <AgroDataTableActions>
                        <AgroDataTableViewButton
                          label={`Ver detalhes do lote ${row.lote}`}
                          onClick={() =>
                            setDetalheAberto({ colheitaId: row.colheitaId, lote: row.lote })
                          }
                        />
                      </AgroDataTableActions>
                    </AgroDataTableTd>
                  </AgroDataTableRow>
                );
              })
            )}
          </AgroDataTableBody>
        </AgroDataTable>

        {movimentacoesRecentes.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">Movimentações recentes</h2>
            <MovimentacoesRecentes items={movimentacoesRecentes} />
          </section>
        ) : null}
      </div>
    </MainLayout>
  );
}

function FilterField({ label, children, className = "min-w-[11.25rem] flex-1" }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </div>
  );
}

function CulturaCell({ cultura }) {
  return (
    <div className="flex items-center gap-2">
      <CulturaIcon cultura={cultura} size="sm" />
      <span className="font-medium text-gray-800">{cultura?.nome ?? "—"}</span>
    </div>
  );
}
