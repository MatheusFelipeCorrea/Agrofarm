import { useEffect, useMemo, useState } from "react";
import Select from "../ui/Select/Select.jsx";
import Button from "../ui/Button/Button.jsx";
import TablePagination from "../ui/TablePagination/TablePagination.jsx";
import { CulturaPill } from "../../pages/Fazendas/fazendaListUi.jsx";
import { HistoricoMapaStatusBadge } from "../ui/badges/DomainBadges.jsx";
import { FilterIcon, MapPinIcon, SearchIcon } from "../ui/icons.jsx";
import {
  AgroDataTableActions,
  AgroDataTableViewButton,
} from "../ui/DataTable/AgroDataTable.jsx";
import { agroTable } from "../ui/DataTable/agroDataTableStyles.js";
import { useClientPagination } from "../../hooks/useClientPagination.js";
import FazendaHistoricoSummaryCards from "./FazendaHistoricoSummaryCards.jsx";
import FazendaHistoricoDetalheModal from "./FazendaHistoricoDetalheModal.jsx";
import { HistoricoMapaDetalheBody } from "./HistoricoMapaDetalhe.jsx";
import {
  useHistoricoMapaQuery,
  useRestaurarHistoricoMapaMutation,
} from "../../queries/fazenda/useFazendaHistoricoQueries.js";
import AgroConfirmDialog from "../dialogs/AgroConfirmDialog.jsx";

const PAGE_SIZE_HISTORICO = 3;

const STATUS_LABEL = {
  COLHIDA: "Colhida",
  ENCERRADA: "Encerrada",
  ARQUIVADA: "Arquivada",
};

function FilterField({ label, children, className = "min-w-[10rem] flex-1" }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}

function formatHa(value) {
  return Number(value ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleDateString("pt-BR");
}

function Thumbnail({ cor }) {
  const hex = cor || "#16a34a";
  return (
    <div
      className="h-16 w-20 shrink-0 rounded-lg ring-1 ring-inset ring-black/10"
      style={{
        background: `linear-gradient(135deg, ${hex}33 0%, ${hex}88 50%, ${hex}44 100%)`,
      }}
      aria-hidden
    />
  );
}

function filtrarItens(itens, { culturaId, status, busca }) {
  const q = busca.trim().toLowerCase();
  return itens.filter((item) => {
    if (culturaId && item.culturaId !== culturaId) return false;
    if (status && item.status !== status) return false;
    if (q) {
      const hay = `${item.nome} ${item.culturaNome ?? ""} ${item.safra ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export default function FazendaHistoricoPanel({
  fazendaId,
  podeOperar = false,
  bloqueioTitulo,
  onVerMapa,
}) {
  const [culturaId, setCulturaId] = useState("");
  const [status, setStatus] = useState("");
  const [busca, setBusca] = useState("");
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [detalheModalItem, setDetalheModalItem] = useState(null);
  const [confirmRestaurar, setConfirmRestaurar] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const { data, isLoading, isError } = useHistoricoMapaQuery(fazendaId, {});
  const restaurar = useRestaurarHistoricoMapaMutation(fazendaId);

  const todosItens = data?.itens ?? [];
  const kpis = data?.kpis;

  const opcoesCultura = useMemo(() => {
    const map = new Map();
    for (const item of todosItens) {
      if (item.culturaId && item.culturaNome) {
        map.set(item.culturaId, { id: item.culturaId, nome: item.culturaNome });
      }
    }
    return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  }, [todosItens]);

  const opcoesStatus = useMemo(() => {
    const set = new Set(todosItens.map((i) => i.status).filter(Boolean));
    return [...set]
      .sort()
      .map((value) => ({ value, label: STATUS_LABEL[value] ?? value }));
  }, [todosItens]);

  useEffect(() => {
    if (culturaId && !opcoesCultura.some((c) => c.id === culturaId)) {
      setCulturaId("");
    }
  }, [culturaId, opcoesCultura]);

  useEffect(() => {
    if (status && !opcoesStatus.some((s) => s.value === status)) {
      setStatus("");
    }
  }, [status, opcoesStatus]);

  const itensFiltrados = useMemo(
    () => filtrarItens(todosItens, { culturaId, status, busca }),
    [todosItens, culturaId, status, busca],
  );

  const historicoPag = useClientPagination(itensFiltrados, PAGE_SIZE_HISTORICO);

  const selecionado = useMemo(() => {
    if (!itensFiltrados.length) return null;
    const id = selecionadoId ?? itensFiltrados[0]?.id;
    return itensFiltrados.find((i) => i.id === id) ?? itensFiltrados[0];
  }, [itensFiltrados, selecionadoId]);

  useEffect(() => {
    if (!selecionadoId) return;
    if (!itensFiltrados.some((i) => i.id === selecionadoId)) {
      setSelecionadoId(itensFiltrados[0]?.id ?? null);
    }
  }, [itensFiltrados, selecionadoId]);

  function selecionarItem(item) {
    setSelecionadoId(item.id);
  }

  function abrirDetalhes(item) {
    selecionarItem(item);
    setDetalheModalItem(item);
  }

  async function handleRestaurar() {
    if (!confirmRestaurar) return;
    setConfirmBusy(true);
    try {
      await restaurar.mutateAsync(confirmRestaurar.id);
      setConfirmRestaurar(null);
    } finally {
      setConfirmBusy(false);
    }
  }

  const listaVazia = !isLoading && !isError && todosItens.length === 0;
  const filtroSemResultado = !isLoading && !isError && todosItens.length > 0 && itensFiltrados.length === 0;

  return (
    <div className="space-y-5">
      <FazendaHistoricoSummaryCards kpis={kpis} loading={isLoading} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_22rem]">
        <section className="min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">Histórico dos mapas anteriores</h2>
            <p className="mt-1 text-sm text-gray-500">
              Talhões removidos do mapa principal ficam arquivados aqui para consulta e restauração.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 px-5 py-4">
            <FilterIcon className="mb-2 hidden h-4 w-4 text-gray-400 sm:block" aria-hidden />
            <FilterField label="Cultura">
              <Select
                value={culturaId}
                onChange={(e) => setCulturaId(e.target.value)}
                disabled={isLoading || opcoesCultura.length === 0}
              >
                <option value="">Todas</option>
                {opcoesCultura.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Status">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isLoading || opcoesStatus.length === 0}
              >
                <option value="">Todos</option>
                {opcoesStatus.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Buscar" className="min-w-[12rem] flex-[1.5]">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Talhão ou cultura…"
                  disabled={isLoading || todosItens.length === 0}
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--agro-brand)] focus:ring-1 focus:ring-[var(--agro-brand)] disabled:bg-gray-50"
                />
              </div>
            </FilterField>
          </div>

          <div className="px-5">
            <div className="divide-y divide-gray-100">
              {isLoading ? (
                <p className="py-10 text-center text-sm text-gray-500">Carregando histórico…</p>
              ) : isError ? (
                <p className="py-10 text-center text-sm text-red-600">Não foi possível carregar o histórico.</p>
              ) : listaVazia ? (
                <p className="py-10 text-center text-sm text-gray-500">
                  Nenhum talhão no histórico. Áreas removidas no mapa aparecerão aqui.
                </p>
              ) : filtroSemResultado ? (
                <p className="py-10 text-center text-sm text-gray-500">
                  Nenhum registro corresponde aos filtros selecionados.
                </p>
              ) : (
                historicoPag.paginatedItems.map((item) => {
                  const ativo = selecionado?.id === item.id;
                  const titulo = item.safra ? `${item.nome} — ${item.safra}` : item.nome;
                  return (
                    <article
                      key={item.id}
                      className={`flex flex-wrap gap-4 py-4 transition-colors ${
                        ativo ? "bg-emerald-50/40 -mx-5 px-5" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selecionarItem(item)}
                        className="flex min-w-0 flex-1 flex-wrap items-start gap-4 text-left"
                      >
                        <Thumbnail cor={item.culturaCor} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900">{titulo}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.culturaNome ? (
                              <CulturaPill nome={item.culturaNome} cor={item.culturaCor} />
                            ) : null}
                            <HistoricoMapaStatusBadge status={item.status} />
                          </div>
                          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                            <div>
                              <dt className="text-gray-500">Área</dt>
                              <dd className="font-medium tabular-nums">{formatHa(item.areaHectares)} ha</dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Plantio</dt>
                              <dd>{formatDate(item.dataPlantio)}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Colheita</dt>
                              <dd>{formatDate(item.dataColheita)}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Produtividade</dt>
                              <dd className="font-medium tabular-nums">
                                {item.produtividadeScHa != null
                                  ? `${item.produtividadeScHa.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} sc/ha`
                                  : "—"}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center">
                        <AgroDataTableActions>
                          <button
                            type="button"
                            className={agroTable.actionBtn}
                            aria-label={`Ver mapa ${item.nome}`}
                            title="Ver no mapa"
                            onClick={() => {
                              selecionarItem(item);
                              onVerMapa?.(item);
                            }}
                          >
                            <MapPinIcon className="h-4 w-4" />
                          </button>
                          <AgroDataTableViewButton
                            label={`Ver detalhes ${item.nome}`}
                            onClick={() => abrirDetalhes(item)}
                          />
                        </AgroDataTableActions>
                      </div>
                      {podeOperar ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="!h-8 !px-3 !text-xs"
                          title={bloqueioTitulo ?? "Restaurar no mapa"}
                          disabled={restaurar.isPending}
                          onClick={() => setConfirmRestaurar(item)}
                        >
                          Restaurar
                        </Button>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>

            {!isLoading && !isError && itensFiltrados.length > 0 ? (
              <TablePagination
                page={historicoPag.page}
                totalPages={historicoPag.totalPages}
                totalItems={historicoPag.totalItems}
                start={historicoPag.start}
                end={historicoPag.end}
                onPageChange={historicoPag.setPage}
                itemLabel={historicoPag.totalItems === 1 ? "área" : "áreas"}
                className="pb-4"
              />
            ) : null}
          </div>
        </section>

        <aside className="hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:block">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">Resumo da área selecionada</h2>
            <p className="mt-1 text-xs text-gray-500">Clique em um talhão ou use Ver detalhes para o painel completo.</p>
          </div>
          {!selecionado ? (
            <p className="px-5 py-8 text-sm text-gray-500">Selecione um registro na lista.</p>
          ) : (
            <div className="max-h-[calc(100dvh-16rem)] overflow-y-auto px-5 py-4">
              <HistoricoMapaDetalheBody item={selecionado} />
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full text-sm"
                onClick={() => abrirDetalhes(selecionado)}
              >
                Abrir detalhes em tela cheia
              </Button>
            </div>
          )}
        </aside>
      </div>

      <FazendaHistoricoDetalheModal
        open={Boolean(detalheModalItem)}
        item={detalheModalItem}
        onClose={() => setDetalheModalItem(null)}
      />

      <AgroConfirmDialog
        open={Boolean(confirmRestaurar)}
        title="Restaurar área"
        message={`Deseja restaurar "${confirmRestaurar?.nome}" no mapa principal?`}
        description="O talhão voltará ao mapa com a mesma geometria e cultura registradas no histórico."
        confirmLabel="Restaurar"
        loading={confirmBusy}
        onClose={() => {
          if (confirmBusy) return;
          setConfirmRestaurar(null);
        }}
        onConfirm={handleRestaurar}
      />
    </div>
  );
}
