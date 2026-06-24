import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout.jsx";
import { notify } from "../../lib/notify.js";
import { useAuthStore } from "../../store/authStore.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { parseValorFromInput } from "../../utils/formatters.js";
import Select from "../../components/ui/Select/Select.jsx";
import { listarCulturas } from "../../services/cultura/cultura.service.js";
import { listarFazendas } from "../../services/fazenda/fazenda.service.js";
import { useColheitaListQuery } from "../../queries/colheita/useColheitaQueries.js";
import {
  useCreateGastoMutation,
  useDeleteGastoMutation,
  useGastoListQuery,
  useGastoResumoQuery,
  useUpdateGastoMutation,
} from "../../queries/gasto/useGastoQueries.js";
import { useCreateLembreteMutation } from "../../queries/lembrete/useLembreteQueries.js";
import { FilterIcon, PlusIcon } from "../../components/ui/icons.jsx";
import GastosSummaryCards from "./components/GastosSummaryCards.jsx";
import GastosTable from "./components/GastosTable.jsx";
import GastoFormModal from "../../components/gastos/GastoFormModal.jsx";
import DeleteGastoModal from "../../components/gastos/DeleteGastoModal.jsx";
import DateRangeFilter from "../../components/ui/DateRangeFilter.jsx";
const TIPOS_PADRAO = ["Sementes", "Adubo", "Manutencao", "Inseticida", "Fertilizante"];
const PAGE_SIZE = 5;
const SELECT_CLS =
  "h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:border-[#2e5b47] focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20";

const makeEmptyForm = () => ({
  fazendaId: "",
  culturaId: "",
  colheitaId: "",
  tipo: "",
  tipoPersonalizado: "",
  valor: "",
  data: new Date().toISOString().slice(0, 10),
  dataVencimento: "",
  status: "PENDENTE",
  descricao: "",
});

const makeEmptyFilters = (isAdmin) => ({
  fazendaId: isAdmin ? "all" : "",
  culturaId: "",
  status: "",
  from: "",
  to: "",
});

export default function Gastos() {
  const [searchParams] = useSearchParams();
  const usuario = useAuthStore((s) => s.usuario);
  const isAdmin = usuario?.role === "ADMIN";

  const [fazendas, setFazendas] = useState([]);
  const [culturas, setCulturas] = useState([]);
  const [tiposCustom, setTiposCustom] = useState([]);

  const [draftFilters, setDraftFilters] = useState(() => makeEmptyFilters(isAdmin));
  const [appliedFilters, setAppliedFilters] = useState(() => makeEmptyFilters(isAdmin));
  const [filtersDirty, setFiltersDirty] = useState(false);
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState("create");
  const [gastoModalOpen, setGastoModalOpen] = useState(false);
  const [form, setForm] = useState(makeEmptyForm);

  const [gastoParaExcluir, setGastoParaExcluir] = useState(null);
  const [marcarPagoBusyId, setMarcarPagoBusyId] = useState(null);

  const createGasto = useCreateGastoMutation();
  const updateGasto = useUpdateGastoMutation();
  const deleteGasto = useDeleteGastoMutation();
  const createLembrete = useCreateLembreteMutation();

  const { data: colheitas = [] } = useColheitaListQuery({});

  const queryFilters = useMemo(() => {
    const cleaned = { ...appliedFilters };
    if (!isAdmin) delete cleaned.fazendaId;
    if (isAdmin && cleaned.fazendaId === "all") delete cleaned.fazendaId;
    return cleaned;
  }, [appliedFilters, isAdmin]);

  const { data: listaData, isError: gastosErro, error: erroGastos, isLoading: gastosLoading } = useGastoListQuery({
    ...queryFilters,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data: resumoData } = useGastoResumoQuery(queryFilters);

  const items = listaData?.items ?? [];
  const meta = listaData?.meta ?? { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 };
  const resumo = resumoData ?? { totalGasto: 0, totalPago: 0, totalPendente: 0 };

  useEffect(() => {
    setDraftFilters(makeEmptyFilters(isAdmin));
    setAppliedFilters(makeEmptyFilters(isAdmin));
    setFiltersDirty(false);
    setPage(1);
  }, [isAdmin]);

  useEffect(() => {
    const fazendaIdUrl = searchParams.get("fazendaId");
    if (!fazendaIdUrl || !isAdmin) return;
    setDraftFilters((prev) => ({ ...prev, fazendaId: fazendaIdUrl }));
    setAppliedFilters((prev) => ({ ...prev, fazendaId: fazendaIdUrl }));
    setFiltersDirty(false);
    setPage(1);
  }, [searchParams, isAdmin]);

  const defaultFilters = useMemo(() => makeEmptyFilters(isAdmin), [isAdmin]);

  useEffect(() => {
    if (!gastosErro || !erroGastos) return;
    notify.error(getApiErrorMessage(erroGastos, "Nao foi possivel carregar os gastos."), { id: "gastos-lista" });
  }, [gastosErro, erroGastos]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [faz, cult] = await Promise.all([listarFazendas(), listarCulturas()]);
        if (!active) return;

        const fazendasUsuario = isAdmin
          ? (Array.isArray(faz) ? faz : [])
          : (Array.isArray(faz) ? faz : []).filter((f) => (usuario?.fazendasVinculadas ?? []).some((v) => v.id === f.id));

        setFazendas(fazendasUsuario);
        setCulturas(Array.isArray(cult) ? cult : []);
      } catch (error) {
        notify.error(getApiErrorMessage(error, "Nao foi possivel carregar dados de apoio."));
      }
    })();

    return () => {
      active = false;
    };
  }, [isAdmin, usuario?.fazendasVinculadas]);

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

  const abrirNovoGasto = () => {
    setModalMode("create");
    setForm(makeEmptyForm());
    setGastoModalOpen(true);
  };

  const abrirEdicao = (row) => {
    setModalMode("edit");
    setForm({
      fazendaId: row.fazenda?.id ?? "",
      culturaId: row.cultura?.id ?? "",
      colheitaId: row.colheitaId ?? "",
      tipo: row.tipo ?? "",
      tipoPersonalizado: row.tipoPersonalizado ?? "",
      valor: String(row.valor ?? ""),
      data: row.data ?? "",
      dataVencimento: row.dataVencimento ?? "",
      status: row.status ?? "PENDENTE",
      descricao: row.descricao ?? "",
    });
    setGastoModalOpen(true);
  };

  const tiposDisponiveis = useMemo(() => {
    const tiposDaApi = items
      .map((i) => i.tipo)
      .filter((tipo) => tipo && tipo !== "OUTRO");

    return [...new Set([...TIPOS_PADRAO, ...tiposCustom, ...tiposDaApi])];
  }, [items, tiposCustom]);

  const payloadFromForm = (f) => ({
    colheitaId: f.colheitaId,
    tipo: f.tipo,
    tipoPersonalizado: f.tipo === "OUTRO" ? f.tipoPersonalizado : undefined,
    valor: parseValorFromInput(f.valor),
    data: f.data,
    dataVencimento: f.dataVencimento || undefined,
    status: f.status,
    descricao: f.descricao?.trim() || undefined,
  });

  const submitGasto = async (options) => {
    try {
      if (!form.colheitaId) {
        notify.error("Selecione fazenda e cultura validas para definir a colheita.");
        return;
      }

      await createGasto.mutateAsync(payloadFromForm(form));

      if (options?.criarLembrete && options?.lembrete) {
        const dataLembrete = new Date(`${options.lembrete.data}T${options.lembrete.hora}`);

        if (!Number.isNaN(dataLembrete.getTime())) {
          createLembrete.mutate({
            titulo: options.lembrete.titulo,
            descricao: options.lembrete.descricao || undefined,
            dataLembrete: dataLembrete.toISOString(),
            telefoneWhatsapp: options.lembrete.telefoneWhatsapp || undefined,
            recorrencia: options.lembrete.recorrencia || "NENHUMA",
            recorrenciaCustom: options.lembrete.recorrencia === "OUTROS" ? options.lembrete.recorrenciaCustom || undefined : undefined,
            fazendaId: form.fazendaId || undefined,
            status: "PENDENTE",
          }, {
            onError: () => notify.error("Gasto criado, mas não foi possível criar o lembrete automático."),
          });
        }
      }

      setGastoModalOpen(false);
      setForm(makeEmptyForm());
    } catch {
      // Toast ja tratado via mutation props.
    }
  };

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!gastoModalOpen) setEditingId(null);
  }, [gastoModalOpen]);

  const submitEdicao = async () => {
    if (!editingId) return;
    try {
      await updateGasto.mutateAsync({ id: editingId, payload: payloadFromForm(form) });
      setGastoModalOpen(false);
      setEditingId(null);
      setForm(makeEmptyForm());
    } catch {
      // Toast ja tratado via mutation props.
    }
  };

  const handleSubmitModal = (options) => (modalMode === "edit" ? submitEdicao() : submitGasto(options));

  const onEditarClick = (row) => {
    setEditingId(row.id);
    abrirEdicao(row);
  };

  const removerGasto = async () => {
    if (!gastoParaExcluir) return;
    try {
      await deleteGasto.mutateAsync(gastoParaExcluir.id);
      setGastoParaExcluir(null);
    } catch {
      // Toast ja tratado via mutation props.
    }
  };

  const handleMarcarPago = async (row) => {
    if (!row?.id || row.status === "PAGO") return;

    setMarcarPagoBusyId(row.id);
    try {
      await updateGasto.mutateAsync({ id: row.id, payload: { status: "PAGO" } });
    } catch {
      // Toast ja tratado via mutation props.
    } finally {
      setMarcarPagoBusyId(null);
    }
  };

  return (
    <MainLayout>
      <GastoFormModal
        open={gastoModalOpen}
        mode={modalMode}
        form={form}
        setForm={setForm}
        loading={createGasto.isPending || updateGasto.isPending}
        onClose={() => setGastoModalOpen(false)}
        onSubmit={handleSubmitModal}
        role={usuario?.role}
        fazendas={fazendas}
        culturas={culturas}
        colheitas={colheitas}
        tiposPadrao={tiposDisponiveis}
        tiposCustom={tiposCustom}
        onAddTipo={(nome) => setTiposCustom((prev) => [...new Set([...prev, nome])])}
        onUpdateTipo={(oldName, newName) =>
          setTiposCustom((prev) => [...new Set(prev.map((tipo) => (tipo === oldName ? newName : tipo)))])
        }
        onDeleteTipo={(nome) => setTiposCustom((prev) => prev.filter((tipo) => tipo !== nome))}
      />

      <DeleteGastoModal
        open={Boolean(gastoParaExcluir)}
        gasto={gastoParaExcluir}
        loading={deleteGasto.isPending}
        onClose={() => setGastoParaExcluir(null)}
        onConfirm={removerGasto}
      />

      <div className="flex w-full flex-col gap-5" style={{ paddingTop: "clamp(1.2rem, 3.5vh, 2rem)" }}>
        <header className="space-y-1">
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-gray-900 md:text-[2.15rem]">Meus Gastos</h1>
          <p className="text-[0.95rem] text-gray-500">Acompanhe e gerencie todos os seus gastos de forma simples e eficiente.</p>
        </header>

        <section className="flex flex-wrap items-end gap-3">
          {isAdmin ? (
            <div className="flex min-w-[11.25rem] flex-1 flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500">Fazenda</span>
              <Select
                value={draftFilters.fazendaId}
                onChange={(e) => {
                  setDraftFilters((p) => ({ ...p, fazendaId: e.target.value }));
                  setFiltersDirty(true);
                }}
                wrapperClassName="relative w-full"
                selectClassName={SELECT_CLS}
              >
                <option value="all">Todas as fazendas</option>
                {fazendas.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </Select>
            </div>
          ) : null}

          <div className="flex min-w-[11.25rem] flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">Cultura</span>
            <Select
              value={draftFilters.culturaId}
              onChange={(e) => {
                setDraftFilters((p) => ({ ...p, culturaId: e.target.value }));
                setFiltersDirty(true);
              }}
              wrapperClassName="relative w-full"
              selectClassName={SELECT_CLS}
            >
              <option value="">Todas as culturas</option>
              {culturas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </div>

          <div className="flex min-w-[11.25rem] flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">Status</span>
            <Select
              value={draftFilters.status}
              onChange={(e) => {
                setDraftFilters((p) => ({ ...p, status: e.target.value }));
                setFiltersDirty(true);
              }}
              wrapperClassName="relative w-full"
              selectClassName={SELECT_CLS}
            >
              <option value="">Todos os status</option>
              <option value="PAGO">Pago</option>
              <option value="PENDENTE">Pendente</option>
              <option value="ATRASADO">Atrasado</option>
            </Select>
          </div>

          <div className="flex min-w-[16rem] flex-[1.35] flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">Período</span>
            <DateRangeFilter
              from={draftFilters.from}
              to={draftFilters.to}
              onChangeFrom={(value) => {
                setDraftFilters((p) => ({ ...p, from: value }));
                setFiltersDirty(true);
              }}
              onChangeTo={(value) => {
                setDraftFilters((p) => ({ ...p, to: value }));
                setFiltersDirty(true);
              }}
            />
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
            onClick={abrirNovoGasto}
          >
            <PlusIcon className="h-4 w-4" />
            Novo Gasto
          </button>
        </section>

        <GastosSummaryCards totals={resumo} />

        <GastosTable
          items={items}
          onMarcarPago={handleMarcarPago}
          marcarPagoBusyId={marcarPagoBusyId}
          loading={gastosLoading}
          meta={{
            page: meta.page,
            totalPages: meta.totalPages,
            totalItems: meta.totalItems,
            pageSize: PAGE_SIZE,
          }}
          onPageChange={setPage}
          onEdit={onEditarClick}
          onDelete={(row) =>
            setGastoParaExcluir({
              id: row.id,
              tipo: row.tipo === "OUTRO" ? row.tipoPersonalizado : row.tipo,
              valor: row.valor,
            })
          }
        />
      </div>
    </MainLayout>
  );
}
