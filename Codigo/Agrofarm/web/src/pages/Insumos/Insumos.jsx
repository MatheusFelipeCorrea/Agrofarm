import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout.jsx";
import { notify } from "../../lib/notify.js";
import { useAuthStore } from "../../store/authStore.js";
import { listarFazendas } from "../../services/fazenda/fazenda.service.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { formatValorForInput, parseValorFromInput } from "../../utils/formatters.js";
import {
  useCreateInsumoMutation,
  useDeleteInsumoMutation,
  useInsumoListQuery,
  useUpdateInsumoMutation,
} from "../../queries/insumo/useInsumoQueries.js";
import InsumosFiltersBar from "./components/InsumosFiltersBar.jsx";
import InsumosSummaryCards from "./components/InsumosSummaryCards.jsx";
import InsumosTable from "./components/InsumosTable.jsx";
import InsumoFormModal from "./components/InsumoFormModal.jsx";
import InsumoDeleteConfirm from "./components/InsumoDeleteConfirm.jsx";

const PAGE_SIZE = 5;

function createEmptyFilters(isAdmin) {
  return {
    fazendaId: isAdmin ? "all" : "",
    categoria: "",
    itemNome: "",
    from: "",
    to: "",
  };
}

function createEmptyForm(fazendaId = "") {
  return {
    fazendaId,
    item: "",
    categoria: "FERTILIZANTE",
    quantidade: "",
    unidade: "kg",
    valorUnitario: "",
    fornecedor: "",
    observacao: "",
    data: new Date().toISOString().slice(0, 10),
  };
}

function hasAnyActiveFilter(filters, isAdmin) {
  return Boolean(
    (isAdmin && filters.fazendaId && filters.fazendaId !== "all") ||
      filters.categoria ||
      filters.itemNome ||
      filters.from ||
      filters.to,
  );
}

export default function Insumos() {
  const [searchParams] = useSearchParams();
  const usuario = useAuthStore((state) => state.usuario);
  const usuarioId = usuario?.id;
  const isAdmin = usuario?.role === "ADMIN";
  const fazendasVinculadas = usuario?.fazendasVinculadas ?? [];

  const [fazendas, setFazendas] = useState([]);
  const [page, setPage] = useState(1);

  const [draftFilters, setDraftFilters] = useState(() => createEmptyFilters(isAdmin));
  const [appliedFilters, setAppliedFilters] = useState(() => createEmptyFilters(isAdmin));

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(createEmptyForm());
  const [rowToDelete, setRowToDelete] = useState(null);

  const fazendasPermitidas = useMemo(() => {
    if (isAdmin) return fazendas;
    return fazendas.filter((fazenda) => fazendasVinculadas.some((vinculo) => vinculo.id === fazenda.id));
  }, [fazendas, fazendasVinculadas, isAdmin]);

  const canList = isAdmin || fazendasPermitidas.length > 0;

  useEffect(() => {
    const fazendaIdUrl = searchParams.get("fazendaId");
    if (fazendaIdUrl && isAdmin) {
      setDraftFilters((prev) => ({ ...prev, fazendaId: fazendaIdUrl }));
      setAppliedFilters((prev) => ({ ...prev, fazendaId: fazendaIdUrl }));
      setPage(1);
    }
  }, [searchParams, isAdmin]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const response = await listarFazendas();
        if (!active) return;

        const allFarms = Array.isArray(response) ? response : [];
        const allowed = isAdmin
          ? allFarms
          : allFarms.filter((fazenda) => fazendasVinculadas.some((vinculo) => vinculo.id === fazenda.id));

        setFazendas(allowed);
      } catch (error) {
        notify.error(getApiErrorMessage(error, "Nao foi possivel carregar as fazendas."));
      }
    })();

    return () => {
      active = false;
    };
  }, [isAdmin, fazendasVinculadas]);

  useEffect(() => {
    const empty = createEmptyFilters(isAdmin);
    setDraftFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  }, [isAdmin]);

  const queryParams = useMemo(() => {
    const params = {
      page,
      pageSize: PAGE_SIZE,
      ...(appliedFilters.categoria ? { categoria: appliedFilters.categoria } : {}),
      ...(appliedFilters.itemNome ? { itemNome: appliedFilters.itemNome } : {}),
      ...(appliedFilters.from ? { from: appliedFilters.from } : {}),
      ...(appliedFilters.to ? { to: appliedFilters.to } : {}),
    };

    if (isAdmin && appliedFilters.fazendaId && appliedFilters.fazendaId !== "all") {
      params.fazendaId = appliedFilters.fazendaId;
    }

    return params;
  }, [appliedFilters, isAdmin, page]);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useInsumoListQuery(queryParams, { enabled: canList });

  useEffect(() => {
    if (!isError || !error) return;
    notify.error(getApiErrorMessage(error, "Nao foi possivel carregar os consumos."), { id: "insumos-lista" });
  }, [isError, error]);

  const createMutation = useCreateInsumoMutation();
  const updateMutation = useUpdateInsumoMutation();
  const deleteMutation = useDeleteInsumoMutation();

  const items = data?.items ?? [];
  const totals = data?.totals;
  const itensDisponiveis = data?.itensDisponiveis ?? [];
  const meta = data?.meta ?? { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 };

  const emptySignature = JSON.stringify(createEmptyFilters(isAdmin));
  const draftSignature = JSON.stringify(draftFilters);
  const appliedSignature = JSON.stringify(appliedFilters);

  const canClear = appliedSignature !== emptySignature && draftSignature === appliedSignature;
  const canApply = hasAnyActiveFilter(draftFilters, isAdmin);

  function resetForm() {
    const presetFarmId = !isAdmin && fazendasPermitidas.length === 1 ? fazendasPermitidas[0].id : "";
    setForm(createEmptyForm(presetFarmId));
    setEditingId(null);
  }

  function handleFilterChange(field, value) {
    setDraftFilters((previous) => ({ ...previous, [field]: value }));
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
    setPage(1);
  }

  function clearFilters() {
    const empty = createEmptyFilters(isAdmin);
    setDraftFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  }

  function handleFilterCta() {
    if (canClear) {
      clearFilters();
      return;
    }

    if (!canApply) return;
    applyFilters();
  }

  function openCreateModal() {
    resetForm();
    setModalOpen(true);
  }

  function openEditModal(row) {
    setEditingId(row.id);
    setForm({
      fazendaId: row.fazendaId,
      item: row.item,
      categoria: row.categoria,
      quantidade: formatValorForInput(row.quantidade),
      unidade: row.unidade,
      valorUnitario: formatValorForInput(row.valorUnitario),
      fornecedor: row.fornecedor ?? "",
      observacao: row.observacao ?? "",
      data: row.data,
    });
    setModalOpen(true);
  }

  async function handleSubmitForm() {
    const quantidade = parseValorFromInput(form.quantidade);
    const valorUnitario = parseValorFromInput(form.valorUnitario);

    if (!form.fazendaId || !form.item.trim() || !form.data) {
      notify.error("Preencha fazenda, insumo e data.");
      return;
    }

    if (!(quantidade > 0)) {
      notify.error("Informe uma quantidade valida.");
      return;
    }

    if (Number.isNaN(valorUnitario) || valorUnitario < 0) {
      notify.error("Informe um valor unitario valido.");
      return;
    }

    const payload = {
      fazendaId: form.fazendaId,
      item: form.item.trim(),
      categoria: form.categoria,
      quantidade,
      unidade: form.unidade,
      valorUnitario,
      fornecedor: form.fornecedor.trim() || undefined,
      observacao: form.observacao.trim() || undefined,
      data: form.data,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      setModalOpen(false);
      resetForm();
    } catch {
      // Toast handled by mutation hooks.
    }
  }

  async function handleConfirmDelete() {
    if (!rowToDelete) return;

    try {
      await deleteMutation.mutateAsync(rowToDelete.id);
      setRowToDelete(null);
    } catch {
      // Toast handled by mutation hooks.
    }
  }

  return (
    <MainLayout>
      <InsumoDeleteConfirm
        open={Boolean(rowToDelete)}
        registro={rowToDelete}
        onClose={() => setRowToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />

      <InsumoFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingId ? "Editar consumo" : "Novo consumo"}
        submitLabel={editingId ? "Salvar alteracoes" : "Registrar"}
        loading={createMutation.isPending || updateMutation.isPending}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmitForm}
        fazendas={fazendasPermitidas}
        role={usuario?.role}
      />

      <div className="flex w-full flex-col gap-5" style={{ paddingTop: "clamp(1.2rem, 3.5vh, 2rem)" }}>
        <header className="space-y-1">
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-gray-900 md:text-[2.15rem]">Insumos</h1>
          <p className="text-[0.95rem] text-gray-500">Registre e acompanhe o consumo de insumos utilizados nas fazendas.</p>
        </header>

        {canList ? (
          <>
            <InsumosFiltersBar
              isAdmin={isAdmin}
              draftFilters={draftFilters}
              onChange={handleFilterChange}
              fazendas={fazendasPermitidas}
              itensDisponiveis={itensDisponiveis}
              canClear={canClear}
              canApply={canApply}
              onFilterCta={handleFilterCta}
              onOpenNovo={openCreateModal}
              disableNovo={!isAdmin && fazendasPermitidas.length === 0}
            />

            <InsumosSummaryCards totals={totals} />

            <InsumosTable
              items={items}
              usuarioId={usuarioId}
              isAdmin={isAdmin}
              loading={isLoading}
              onEdit={openEditModal}
              onDelete={(row) => setRowToDelete(row)}
            />

            {!isLoading ? (
              <div className="flex flex-col gap-3 border-t border-gray-200 px-1 py-1 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Mostrando {meta.totalItems === 0 ? 0 : (meta.page - 1) * PAGE_SIZE + 1} a {" "}
                  {Math.min(meta.page * PAGE_SIZE, meta.totalItems)} de {meta.totalItems} registros
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40"
                    onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                    disabled={page <= 1}
                    aria-label="Pagina anterior"
                  >
                    ‹
                  </button>

                  {Array.from({ length: meta.totalPages }, (_, index) => index + 1).map((targetPage) => (
                    <button
                      key={targetPage}
                      type="button"
                      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition-colors ${
                        targetPage === page
                          ? "border-[#0d4f3a] bg-[#0d4f3a] text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                      onClick={() => setPage(targetPage)}
                    >
                      {targetPage}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40"
                    onClick={() => setPage((previous) => Math.min(meta.totalPages, previous + 1))}
                    disabled={page >= meta.totalPages}
                    aria-label="Proxima pagina"
                  >
                    ›
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-center text-sm text-gray-600">Nenhuma fazenda vinculada ao usuario.</p>
        )}
      </div>
    </MainLayout>
  );
}
