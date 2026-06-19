import { useMemo, useState } from "react";
import Button from "../ui/Button/Button.jsx";
import { CREATE_BUTTON_CLASSNAME } from "../../constants/createButton.js";
import TablePagination from "../ui/TablePagination/TablePagination.jsx";
import { CountBadge, CulturaStatusBadge } from "../ui/badges/DomainBadges.jsx";
import {
  AgroDataTable,
  AgroDataTableActions,
  AgroDataTableBody,
  AgroDataTableDeleteButton,
  AgroDataTableEditButton,
  AgroDataTableEmpty,
  AgroDataTableHead,
  AgroDataTableRow,
  AgroDataTableTd,
  AgroDataTableTh,
  agroTable,
} from "../ui/DataTable/AgroDataTable.jsx";
import { LeafIcon, PlusIcon, SearchIcon } from "../ui/icons.jsx";
import CulturaIcon from "./CulturaIcon.jsx";
import CulturasSummaryCards from "./CulturasSummaryCards.jsx";
import { PAGE_SIZE_DEFAULT, useClientPagination } from "../../hooks/useClientPagination.js";
import {
  buildCulturaAggregatesFromFazendas,
  computeFazendaCulturaKpis,
  computeGlobalCulturaKpis,
  formatHa,
} from "../../utils/culturaAggregates.js";
function normalizeSearch(text) {
  return (text ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Painel de culturas no layout do protótipo (KPIs + tabela).
 * variant="global" — gerenciamento geral (catálogo + fazendas vinculadas + criar cultura).
 * variant="fazenda" — aba detalhe da fazenda (vínculos, sem criar catálogo nem coluna de fazendas).
 */
export default function CulturasGestaoPanel({
  variant = "global",
  culturas = [],
  fazendas = [],
  vinculos = [],
  loading = false,
  isAdmin = false,
  podeOperar = true,
  bloqueioTitulo,
  onCreateCatalog,
  onEditCatalog,
  onDeleteCatalog,
  onAddVinculo,
  onEditVinculo,
  onDeleteVinculo,
  pageSize = PAGE_SIZE_DEFAULT,
  className = "",
}) {
  const isGlobal = variant === "global";
  const [busca, setBusca] = useState("");

  const aggregatesById = useMemo(
    () => (isGlobal ? buildCulturaAggregatesFromFazendas(fazendas) : {}),
    [isGlobal, fazendas],
  );

  const kpis = useMemo(() => {
    if (isGlobal) return computeGlobalCulturaKpis(culturas, aggregatesById);
    return computeFazendaCulturaKpis(vinculos);
  }, [isGlobal, culturas, aggregatesById, vinculos]);

  const rowsGlobal = useMemo(() => {
    const sorted = [...culturas].sort((a, b) =>
      (a.nome ?? "").localeCompare(b.nome ?? "", "pt", { sensitivity: "base" }),
    );
    const q = normalizeSearch(busca);
    if (!q) return sorted;
    return sorted.filter((c) => normalizeSearch(c.nome).includes(q));
  }, [culturas, busca]);

  const rowsFazenda = useMemo(() => {
    const sorted = [...vinculos].sort((a, b) =>
      (a.cultura?.nome ?? "").localeCompare(b.cultura?.nome ?? "", "pt", { sensitivity: "base" }),
    );
    const q = normalizeSearch(busca);
    if (!q) return sorted;
    return sorted.filter((v) => normalizeSearch(v.cultura?.nome).includes(q));
  }, [vinculos, busca]);

  const tableRows = isGlobal ? rowsGlobal : rowsFazenda;
  const pagination = useClientPagination(tableRows, pageSize);

  const showCreateCatalog = isGlobal && isAdmin && onCreateCatalog;
  const showAddVinculo = !isGlobal && onAddVinculo;
  const showAdminActions = isGlobal && isAdmin;
  const showVinculoActions = !isGlobal && podeOperar;

  const colCount = isGlobal
    ? showAdminActions
      ? 5
      : 4
    : showVinculoActions
      ? 4
      : 3;

  const emptyMessage = isGlobal
    ? busca
      ? "Nenhuma cultura encontrada para esta busca."
      : "Nenhuma cultura cadastrada."
    : busca
      ? "Nenhuma cultura encontrada para esta busca."
      : 'Nenhuma cultura nesta fazenda. Use "Adicionar cultura" para vincular a primeira.';

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      <CulturasSummaryCards variant={variant} kpis={kpis} loading={loading} />

      <section className={agroTable.section}>
        <div className="flex flex-col gap-4 border-b border-gray-100 px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50">
                <LeafIcon className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Culturas cadastradas</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {isGlobal
                    ? "Gerencie as culturas utilizadas em suas fazendas."
                    : "Culturas vinculadas a esta fazenda."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-64">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar cultura…"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-[var(--agro-brand)] focus:ring-2 focus:ring-[var(--agro-brand)]/20"
                  aria-label="Buscar cultura"
                />
              </div>

              {showCreateCatalog ? (
                <Button
                  type="button"
                  variant="primaryBrand"
                  className={CREATE_BUTTON_CLASSNAME}
                  onClick={onCreateCatalog}
                >
                  <PlusIcon className="h-4 w-4 shrink-0" />
                  Criar Cultura
                </Button>
              ) : null}

              {showAddVinculo ? (
                <Button
                  type="button"
                  variant="primaryBrand"
                  className={CREATE_BUTTON_CLASSNAME}
                  title={bloqueioTitulo}
                  disabled={loading || !podeOperar}
                  onClick={onAddVinculo}
                >
                  <PlusIcon className="h-4 w-4 shrink-0" />
                  Adicionar cultura
                </Button>
              ) : null}

              {isGlobal && !isAdmin ? (
                <p className="max-w-xs text-xs text-gray-500 sm:text-right">
                  Apenas o administrador pode criar, editar ou excluir culturas. Você pode vincular culturas dentro de
                  cada fazenda.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <AgroDataTable embedded minWidth={720} loading={loading} loadingMessage="Carregando culturas…">
          <AgroDataTableHead>
            <AgroDataTableTh align="left">Cultura</AgroDataTableTh>
            <AgroDataTableTh>{isGlobal ? "Hectares usados" : "Hectares na fazenda"}</AgroDataTableTh>
            {isGlobal ? <AgroDataTableTh>Área média por fazenda</AgroDataTableTh> : <AgroDataTableTh>Status</AgroDataTableTh>}
            {isGlobal ? <AgroDataTableTh>Fazendas vinculadas</AgroDataTableTh> : null}
            {showAdminActions || showVinculoActions ? <AgroDataTableTh>Ações</AgroDataTableTh> : null}
          </AgroDataTableHead>

          <AgroDataTableBody>
            {!loading && pagination.paginatedItems.length === 0 ? (
              <AgroDataTableEmpty colSpan={colCount}>{emptyMessage}</AgroDataTableEmpty>
            ) : isGlobal ? (
              pagination.paginatedItems.map((c) => {
                const agg = aggregatesById[c.id];
                const fazendasVinc = agg?.fazendasVinculadas ?? 0;
                const hectaresUsados = agg?.hectaresUsados ?? Number(c.hectares ?? 0);
                const areaMedia = fazendasVinc > 0 ? hectaresUsados / fazendasVinc : null;

                return (
                  <AgroDataTableRow key={c.id}>
                    <AgroDataTableTd align="left">
                      <div className="flex items-center gap-3">
                        <CulturaIcon cultura={c} size="md" />
                        <span className="font-semibold text-gray-900">{c.nome}</span>
                      </div>
                    </AgroDataTableTd>
                    <AgroDataTableTd className="tabular-nums">
                      {formatHa(hectaresUsados, { maximumFractionDigits: 2 })}
                    </AgroDataTableTd>
                    <AgroDataTableTd className="tabular-nums">
                      {areaMedia != null ? (
                        formatHa(areaMedia, { maximumFractionDigits: 3 })
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </AgroDataTableTd>
                    <AgroDataTableTd>
                      <CountBadge>{fazendasVinc}</CountBadge>
                    </AgroDataTableTd>
                    {showAdminActions && (
                      <AgroDataTableTd>
                        <AgroDataTableActions>
                          <AgroDataTableEditButton
                            label={`Editar ${c.nome}`}
                            onClick={() => onEditCatalog?.(c)}
                          />
                          <AgroDataTableDeleteButton
                            label={`Excluir ${c.nome}`}
                            onClick={() => onDeleteCatalog?.(c)}
                          />
                        </AgroDataTableActions>
                      </AgroDataTableTd>
                    )}
                  </AgroDataTableRow>
                );
              })
            ) : (
              pagination.paginatedItems.map((v) => (
                <AgroDataTableRow key={v.id}>
                  <AgroDataTableTd align="left">
                    <div className="flex items-center gap-3">
                      {v.cultura ? (
                        <>
                          <CulturaIcon cultura={v.cultura} size="md" />
                          <span className="font-semibold text-gray-900">{v.cultura.nome}</span>
                        </>
                      ) : (
                        <span className="font-medium text-gray-900">—</span>
                      )}
                    </div>
                  </AgroDataTableTd>
                  <AgroDataTableTd className="tabular-nums">
                    {formatHa(v.hectares, { maximumFractionDigits: 2 })}
                  </AgroDataTableTd>
                  <AgroDataTableTd>
                    <div className="flex justify-center">
                      <CulturaStatusBadge status={v.status} />
                    </div>
                  </AgroDataTableTd>
                  {showVinculoActions && (
                    <AgroDataTableTd>
                      <AgroDataTableActions>
                        <AgroDataTableEditButton
                          label={`Editar ${v.cultura?.nome ?? "cultura"}`}
                          disabled={!podeOperar}
                          onClick={() => onEditVinculo?.(v)}
                        />
                        <AgroDataTableDeleteButton
                          label={`Excluir ${v.cultura?.nome ?? "cultura"}`}
                          disabled={!podeOperar}
                          onClick={() => onDeleteVinculo?.(v)}
                        />
                      </AgroDataTableActions>
                    </AgroDataTableTd>
                  )}
                </AgroDataTableRow>
              ))
            )}
          </AgroDataTableBody>
        </AgroDataTable>

        {pagination.showPagination ? (
          <TablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            start={pagination.start}
            end={pagination.end}
            onPageChange={pagination.setPage}
            itemLabel={pagination.totalItems === 1 ? "cultura" : "culturas"}
            className="border-t border-gray-200 px-4 sm:px-6"
          />
        ) : null}
      </section>
    </div>
  );
}
