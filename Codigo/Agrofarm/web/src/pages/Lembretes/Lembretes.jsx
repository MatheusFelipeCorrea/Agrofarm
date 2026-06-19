import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { notify } from "../../lib/notify.js";
import LembreteCalendar from "../../components/lembretes/LembreteCalendar";
import LembreteCardList from "../../components/lembretes/LembreteCardList";
import { FilterIcon, PlusIcon } from "../../components/ui/icons.jsx";
import Select from "../../components/ui/Select/Select.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";
import {
  useLembreteDiaQuery,
  useLembreteCalendarioQuery,
  useDeleteLembreteMutation,
  useUpdateLembreteMutation,
  useCreateLembreteMutation,
  useUpdateLembreteStatusMutation
} from "../../queries/lembrete/useLembreteQueries";
import { useFazendaListQuery } from "../../queries/fazenda/useFazendaQueries";
import DeleteLembreteModal from "../../components/lembretes/DeleteLembreteModal";
import LembreteFormModal from "../../components/lembretes/LembreteFormModal";

const hoje = new Date();

const LEMBRETES_POR_PAGINA = 5;

const FILTER_SELECT_CLS =
  "h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:border-[#2e5b47] focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20";

const hojeFormatado = `${hoje.getFullYear()}-${String(
  hoje.getMonth() + 1
).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

export default function Lembretes() {
  const [searchParams] = useSearchParams();

  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [selectedDate, setSelectedDate] = useState(hojeFormatado);
  const [currentDate, setCurrentDate] = useState(hoje);
  const [currentPage, setCurrentPage] = useState(1);

  const deleteMutation = useDeleteLembreteMutation();
  const updateMutation = useUpdateLembreteMutation();
  const createMutation = useCreateLembreteMutation();
  const updateStatusMutation = useUpdateLembreteStatusMutation();

  const mes = currentDate.getMonth() + 1;
  const ano = currentDate.getFullYear();

  const handleDelete = (id) => {
    deleteMutation.mutate(id, {
      onSuccess: () => setDeleteItem(null),
    });
  };

  const handleUpdate = (id, data) => {
    updateMutation.mutate(
      { id, data },
      {
        onSuccess: () => setEditItem(null),
      }
    );
  };

  const handleToggleStatus = (item) => {
    const novoStatus =
      item.status === "ENVIADO" ? "PENDENTE" : "ENVIADO";

    updateStatusMutation.mutate(
      { id: item.id, status: novoStatus },
      { onError: () => notify.error("Erro ao atualizar status do lembrete.") }
    );
  };

  const [draftFilters, setDraftFilters] = useState({
    status: "",
    fazendaId: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    status: "",
    fazendaId: "",
  });

  useEffect(() => {
    const fazendaId = searchParams.get("fazendaId") ?? "";
    if (!fazendaId) return;
    setDraftFilters((p) => ({ ...p, fazendaId }));
    setAppliedFilters((p) => ({ ...p, fazendaId }));
  }, [searchParams]);

  const [isCreating, setIsCreating] = useState(false);
  const [filtersDirty, setFiltersDirty] = useState(false);

  const hasApplied =
    appliedFilters.status !== "" ||
    appliedFilters.fazendaId !== "";

  const canClear = hasApplied && !filtersDirty;

  const { data: calendario } =
    useLembreteCalendarioQuery({
      mes,
      ano,
      fazendaId: appliedFilters.fazendaId,
      status: appliedFilters.status,
    });

  const handleFiltrar = () => {
    setAppliedFilters(draftFilters);
    setFiltersDirty(false);
  };

  const handleLimpar = () => {
    const empty = { status: "", fazendaId: "" };
    setDraftFilters(empty);
    setAppliedFilters(empty);
    setFiltersDirty(false);
  };

  const handleFilterCta = () => {
    if (canClear) {
      handleLimpar();
      return;
    }

    handleFiltrar();
  };

  const { data: lembretes, isLoading } = useLembreteDiaQuery({
    data: selectedDate,
    status: appliedFilters.status,
    fazendaId: appliedFilters.fazendaId,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, appliedFilters.status, appliedFilters.fazendaId]);

  const lembretesLista = useMemo(() => (Array.isArray(lembretes) ? lembretes : []), [lembretes]);
  const totalPages = Math.max(1, Math.ceil(lembretesLista.length / LEMBRETES_POR_PAGINA));

  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const lembretesPaginados = useMemo(() => {
    const inicio = (currentPage - 1) * LEMBRETES_POR_PAGINA;
    return lembretesLista.slice(inicio, inicio + LEMBRETES_POR_PAGINA);
  }, [currentPage, lembretesLista]);

  const { data: fazendas = [] } = useFazendaListQuery();

  return (
    <MainLayout hideHeaderInput>
      <div className="flex w-full flex-col gap-5" style={{ paddingTop: "clamp(1.2rem, 3.5vh, 2rem)" }}>
        <header className="space-y-1">
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-gray-900 md:text-[2.15rem]">Lembretes</h1>
          <p className="text-[0.95rem] text-gray-500">Acompanhe seus compromissos e tarefas importantes.</p>
        </header>

        <section className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[11.25rem] flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">Fazenda</span>
              <Select
                value={draftFilters.fazendaId}
                onChange={(e) => {
                  setDraftFilters((prev) => ({
                    ...prev,
                    fazendaId: e.target.value,
                  }));
                  setFiltersDirty(true);
                }}
                wrapperClassName="w-full"
                selectClassName={FILTER_SELECT_CLS}
                placeholder="Todas as fazendas"
              >
                <option value="">Todas as fazendas</option>
                {fazendas.map((fazenda) => (
                  <option key={fazenda.id} value={fazenda.id}>
                    {fazenda.nome}
                  </option>
                ))}
              </Select>
          </div>

          <div className="flex min-w-[11.25rem] flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">Status</span>
              <Select
                value={draftFilters.status}
                onChange={(e) => {
                  setDraftFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }));
                  setFiltersDirty(true);
                }}
                wrapperClassName="w-full"
                selectClassName={FILTER_SELECT_CLS}
                placeholder="Todos os status"
              >
                <option value="">Todos os status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="ENVIADO">Concluído</option>
                <option value="ATRASADO">Atrasado</option>
              </Select>
          </div>

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2e5b47] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#254a3a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2e5b47] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleFilterCta}
            disabled={!hasApplied && !filtersDirty}
          >
            <FilterIcon className="h-3.5 w-3.5 shrink-0" />
            {canClear ? "Limpar filtros" : "Filtrar"}
          </button>

          <button
            type="button"
            className="ml-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f7f3b] px-5 text-sm font-semibold text-white"
            onClick={() => setIsCreating(true)}
          >
            <PlusIcon className="h-4 w-4" />
            Novo Lembrete
          </button>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          <LembreteCalendar
            calendario={calendario}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
          />

          <LembreteCardList
            selectedDate={selectedDate}
            lembretes={lembretesPaginados}
            totalItems={lembretesLista.length}
            itensPorPagina={LEMBRETES_POR_PAGINA}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            onEdit={setEditItem}
            onDelete={setDeleteItem}
            onToggleStatus={handleToggleStatus}
          />

          <DeleteLembreteModal
            item={deleteItem}
            loading={deleteMutation.isPending}
            onClose={() => setDeleteItem(null)}
            onConfirm={handleDelete}
          />

          <LembreteFormModal
            item={editItem}
            onClose={() => setEditItem(null)}
            onSubmit={handleUpdate}
            fazendas={fazendas}
            loading={updateMutation.isPending}
          />

          <LembreteFormModal
            item={isCreating ? { fazendaId: appliedFilters.fazendaId || "", data: selectedDate } : null}
            onClose={() => setIsCreating(false)}
            fazendas={fazendas}
            loading={createMutation.isPending}
            onSubmit={(payload) => {
              createMutation.mutate(payload, {
                onSuccess: () => setIsCreating(false),
                onError: () => notify.error("Não foi possível criar o lembrete."),
              });
            }}
          />

        </div>
      </div>
    </MainLayout>
  );
}