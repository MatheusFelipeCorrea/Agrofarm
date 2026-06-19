import MainLayout from "../../layouts/MainLayout.jsx";
import { useEffect, useMemo, useState } from "react";
import { notify } from "../../lib/notify.js";
import { useAuthStore } from "../../store/authStore.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { PlusIcon } from "../../components/ui/icons.jsx";
import { listarCulturas } from "../../services/cultura/cultura.service.js";
import { listarFazendas } from "../../services/fazenda/fazenda.service.js";
import {
  useColheitaListQuery,
  useCreateColheitaMutation,
  useDeleteColheitaMutation,
  useUpdateColheitaMutation,
} from "../../queries/colheita/useColheitaQueries.js";
import ColheitasFiltersBar from "./components/ColheitasFiltersBar.jsx";
import ColheitasTable from "./components/ColheitasTable.jsx";
import ColheitaUpsertModal from "./components/ColheitaUpsertModal.jsx";
import ColheitaDeleteConfirm from "./components/ColheitaDeleteConfirm.jsx";

export default function Colheitas() {
  const usuario = useAuthStore((s) => s.usuario);
  const isAdmin = usuario?.role === "ADMIN";

  const [fazendas, setFazendas] = useState([]);
  const [culturas, setCulturas] = useState([]);

  const makeEmptyFilters = (admin) => ({
    fazendaId: admin ? "all" : "",
    culturaId: "",
    from: "",
    to: "",
  });

  const [draftFilters, setDraftFilters] = useState(() => makeEmptyFilters(isAdmin));
  const [appliedFilters, setAppliedFilters] = useState(() => makeEmptyFilters(isAdmin));
  const [filtersDirty, setFiltersDirty] = useState(false);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [form, setForm] = useState({
    fazendaId: "",
    culturaId: "",
    dataColheita: new Date().toISOString().slice(0, 10),
    sacasProduzidas: "",
  });

  const [editId, setEditId] = useState(null);

  const [colheitaParaExcluir, setColheitaParaExcluir] = useState(null);

  const queryFilters = useMemo(() => {
    const cleaned = { ...appliedFilters };
    if (!isAdmin) {
      delete cleaned.fazendaId;
    }
    if (isAdmin && cleaned.fazendaId === "all") {
      delete cleaned.fazendaId;
    }
    return cleaned;
  }, [appliedFilters, isAdmin]);

  const { data: colheitas = [], isLoading, isError, error } = useColheitaListQuery(queryFilters);

  const createMutation = useCreateColheitaMutation();
  const updateMutation = useUpdateColheitaMutation();
  const deleteMutation = useDeleteColheitaMutation();

  const fazendasVinculadas = useMemo(
    () => usuario?.fazendasVinculadas ?? [],
    [usuario?.fazendasVinculadas],
  );

  const fazendasPermitidas = useMemo(() => {
    if (isAdmin) return fazendas;
    return (fazendas ?? []).filter((f) => fazendasVinculadas.some((v) => v.id === f.id));
  }, [isAdmin, fazendas, fazendasVinculadas]);

  const culturasPorFazenda = useMemo(() => {
    const mapa = new Map();
    (colheitas ?? []).forEach((c) => {
      if (!c.fazendaId || !c.cultura) return;
      if (!mapa.has(c.fazendaId)) mapa.set(c.fazendaId, new Map());
      mapa.get(c.fazendaId).set(c.cultura.id, c.cultura.nome);
    });
    return mapa;
  }, [colheitas]);

  const culturasFiltradas = useMemo(() => {
    const fazendaSelecionada = draftFilters.fazendaId;
    if (!fazendaSelecionada || fazendaSelecionada === "all") return culturas;

    const disponiveis = culturasPorFazenda.get(fazendaSelecionada);
    if (!disponiveis || disponiveis.size === 0) return culturas;
    return culturas.filter((c) => disponiveis.has(c.id));
  }, [culturas, culturasPorFazenda, draftFilters.fazendaId]);

  const filteredRows = useMemo(() => {
    const rows = Array.isArray(colheitas) ? colheitas : [];
    if (!isAdmin) return rows;
    if (!appliedFilters.fazendaId || appliedFilters.fazendaId === "all") return rows;
    return rows.filter((r) => r.fazendaId === appliedFilters.fazendaId);
  }, [colheitas, appliedFilters.fazendaId, isAdmin]);

  const PAGE_SIZE = 5;
  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, safePage]);

  useEffect(() => {
    setPage(1);
  }, [appliedFilters]);

  useEffect(() => {
    setDraftFilters(makeEmptyFilters(isAdmin));
    setAppliedFilters(makeEmptyFilters(isAdmin));
    setFiltersDirty(false);
  }, [isAdmin]);

  useEffect(() => {
    if (!isError || !error) return;
    notify.error(getApiErrorMessage(error, "Não foi possível carregar as colheitas."), { id: "colheitas-lista" });
  }, [isError, error]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [faz, cult] = await Promise.all([listarFazendas(), listarCulturas()]);
        if (!active) return;

        const todas = Array.isArray(faz) ? faz : [];
        const permitidas = isAdmin
          ? todas
          : todas.filter((f) => (usuario?.fazendasVinculadas ?? []).some((v) => v.id === f.id));

        setFazendas(permitidas);
        setCulturas(Array.isArray(cult) ? cult : []);
      } catch (err) {
        notify.error(getApiErrorMessage(err, "Nao foi possivel carregar filtros (fazendas/culturas)."));
      }
    })();
    return () => {
      active = false;
    };
  }, [isAdmin, usuario?.fazendasVinculadas]);

  const defaultSignature = JSON.stringify(makeEmptyFilters(isAdmin));
  const draftSignature = JSON.stringify(draftFilters);
  const appliedSignature = JSON.stringify(appliedFilters);
  const hasApplied = appliedSignature !== defaultSignature;
  const canClear = hasApplied && draftSignature === appliedSignature;
  const hasAnyDraftFilter = Boolean(
    (isAdmin && draftFilters.fazendaId && draftFilters.fazendaId !== "all") ||
      draftFilters.culturaId ||
      draftFilters.from ||
      draftFilters.to,
  );

  const handleFilterChange = (field, value) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value }));
    setFiltersDirty(true);
  };

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
    if (!canClear && !hasAnyDraftFilter) {
      return;
    }

    if (canClear) {
      handleClearFilters();
      return;
    }
    handleApplyFilters();
  };

  const getEmptyForm = () => ({
    fazendaId: "",
    culturaId: "",
    dataColheita: new Date().toISOString().slice(0, 10),
    sacasProduzidas: "",
  });

  const abrirNovaColheita = () => {
    const next = getEmptyForm();
    if (!isAdmin && fazendasPermitidas.length === 1) {
      next.fazendaId = fazendasPermitidas[0].id;
    }
    setForm(next);
    setEditId(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const abrirEdicao = (row) => {
    setForm({
      fazendaId: row.fazendaId ?? "",
      culturaId: row.culturaId ?? "",
      dataColheita: row.dataColheita ?? "",
      sacasProduzidas: String(row.sacasProduzidas ?? ""),
    });
    setEditId(row.id);
    setModalMode("edit");
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setEditId(null);
  };

  async function handleCreate() {
    try {
      await createMutation.mutateAsync({
        fazendaId: form.fazendaId,
        culturaId: form.culturaId,
        dataColheita: form.dataColheita,
        sacasProduzidas: Number(form.sacasProduzidas || 0),
      });
      fecharModal();
    } catch {
      // toast já tratado no mutationProps
    }
  }

  async function handleUpdate() {
    if (!editId) return;
    try {
      await updateMutation.mutateAsync({
        id: editId,
        payload: {
          fazendaId: form.fazendaId || undefined,
          culturaId: form.culturaId || undefined,
          dataColheita: form.dataColheita || undefined,
          sacasProduzidas: form.sacasProduzidas ? Number(form.sacasProduzidas) : undefined,
        },
      });
      fecharModal();
    } catch {
      // toast já tratado
    }
  }

  async function handleDeleteConfirm() {
    if (!colheitaParaExcluir) return;
    try {
      await deleteMutation.mutateAsync(colheitaParaExcluir.id);
      setColheitaParaExcluir(null);
    } catch {
      // toast já tratado
    }
  }

  return (
    <MainLayout>
      <ColheitaDeleteConfirm
        open={!!colheitaParaExcluir}
        colheita={colheitaParaExcluir}
        onClose={() => setColheitaParaExcluir(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
      />

      <ColheitaUpsertModal
        open={modalOpen}
        mode={modalMode}
        onClose={fecharModal}
        loading={modalMode === "edit" ? updateMutation.isPending : createMutation.isPending}
        form={form}
        setForm={setForm}
        onSubmit={modalMode === "edit" ? handleUpdate : handleCreate}
        fazendas={fazendasPermitidas}
        culturas={culturas}
        role={usuario?.role}
      />

      <div className="flex w-full flex-col gap-5" style={{ paddingTop: "clamp(1.2rem, 3.5vh, 2rem)" }}>
        <header className="space-y-1">
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-gray-900 md:text-[2.15rem]">Minhas Colheitas</h1>
          <p className="text-[0.95rem] text-gray-500">Acompanhe todas as colheitas realizadas nas suas fazendas.</p>
        </header>

        <div className="flex flex-wrap items-end gap-3">
          <ColheitasFiltersBar
            isAdmin={isAdmin}
            draftFilters={draftFilters}
            onChange={handleFilterChange}
            fazendas={fazendasPermitidas}
            culturas={culturasFiltradas}
            canClear={canClear}
            canApply={hasAnyDraftFilter}
            onFilterCta={handleFilterCta}
          />

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f7f3b] px-5 text-sm font-semibold text-white"
            onClick={abrirNovaColheita}
          >
            <PlusIcon className="h-4 w-4" />
            Nova Colheita
          </button>
        </div>

        {isLoading ? (
          <section className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
            Carregando colheitas...
          </section>
        ) : (
          <ColheitasTable
            items={pagedRows}
            onEdit={abrirEdicao}
            onDelete={(row) => setColheitaParaExcluir(row)}
            page={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
          />
        )}
      </div>
    </MainLayout>
  );
}
