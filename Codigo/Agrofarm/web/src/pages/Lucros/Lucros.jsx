import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";
import { notify } from "../../lib/notify.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { FilterIcon, PlusIcon } from "../../components/ui/icons.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";
import Select from "../../components/ui/Select/Select.jsx";
import DateRangeFilter from "../../components/ui/DateRangeFilter.jsx";
import { listarFazendas } from "../../services/fazenda/fazenda.service.js";
import { listarColheitas } from "../../services/colheita/colheita.service.js";
import { listarEstoque } from "../../services/estoque/estoque.service.js";
import { listarCulturas } from "../../services/cultura/cultura.service.js";
import {
  useCreateLucroMutation,
  useDeleteLucroMutation,
  useLucroListQuery,
  useLucroTotalQuery,
  useUpdateLucroMutation,
  useMarcarRecebimentoArrendamentoMutation,
} from "../../queries/lucro/useLucroQueries.js";
import LucroTable from "../../components/lucros/LucroTable.jsx";
import LucroFormModal from "../../components/lucros/LucroFormModal.jsx";
import DeleteLucroModal from "../../components/lucros/DeleteLucroModal.jsx";
import LucroTotalCard from "./LucroTotalCard.jsx";

function emptyLucroForm() {
  return {
    fazendaId: "",
    culturaId: "",
    colheitaId: "",
    quantidadeSacas: "",
    valorUnitario: "",
    comprador: "",
    data: new Date().toISOString().slice(0, 10),
  };
}

const SELECT_CLS =
  "h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:border-[#2e5b47] focus:outline-none focus:ring-2 focus:ring-[#2e5b47]/20";

export default function Lucros() {
  const [searchParams] = useSearchParams();
  const usuario = useAuthStore((s) => s.usuario);
  const isAdmin = usuario?.role === "ADMIN";

  const fazendasVinculadasIds = useMemo(
    () => new Set((usuario?.fazendasVinculadas ?? []).map((f) => f.id)),
    [usuario?.fazendasVinculadas],
  );

  const [fazendas, setFazendas] = useState([]);
  const [culturas, setCulturas] = useState([]);
  const [colheitas, setColheitas] = useState([]);
  const [saldosPorColheita, setSaldosPorColheita] = useState({});
  const [saldosEstoqueCarregados, setSaldosEstoqueCarregados] = useState(false);

  const [draftFilters, setDraftFilters] = useState({
    fazendaId: "",
    culturaId: "",
    from: "",
    to: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    fazendaId: "",
    culturaId: "",
    from: "",
    to: "",
  });

  const [filtersDirty, setFiltersDirty] = useState(false);

  const [modalNovoOpen, setModalNovoOpen] = useState(false);
  const [novoForm, setNovoForm] = useState(emptyLucroForm);
  const [modalEdicaoOpen, setModalEdicaoOpen] = useState(false);
  const [edicaoId, setEdicaoId] = useState(null);
  const [edicaoForm, setEdicaoForm] = useState(emptyLucroForm);
  const [lucroParaExcluir, setLucroParaExcluir] = useState(null);
  const [recebimentoBusyId, setRecebimentoBusyId] = useState(null);

  const [page, setPage] = useState(1);

  const queryFilters = useMemo(() => {
    const f = {};
    if (appliedFilters.fazendaId) f.fazendaId = appliedFilters.fazendaId;
    if (appliedFilters.culturaId) f.culturaId = appliedFilters.culturaId;
    if (appliedFilters.from) f.from = appliedFilters.from;
    if (appliedFilters.to) f.to = appliedFilters.to;
    f.page = page;
    f.pageSize = 5;
    return f;
  }, [appliedFilters, page]);

  const totalQueryFilters = useMemo(() => {
    const f = {};
    if (appliedFilters.fazendaId) f.fazendaId = appliedFilters.fazendaId;
    if (appliedFilters.culturaId) f.culturaId = appliedFilters.culturaId;
    if (appliedFilters.from) f.from = appliedFilters.from;
    if (appliedFilters.to) f.to = appliedFilters.to;
    return f;
  }, [appliedFilters]);

  const {
    data: lucroListData,
    isError: lucrosListaErro,
    error: erroListaLucros,
    isLoading: lucrosLoading,
  } = useLucroListQuery(queryFilters);

  const { data: totalData } = useLucroTotalQuery(totalQueryFilters);

  const createMutation = useCreateLucroMutation();
  const updateMutation = useUpdateLucroMutation();
  const deleteMutation = useDeleteLucroMutation();
  const recebimentoMutation = useMarcarRecebimentoArrendamentoMutation();

  const items = lucroListData?.items ?? [];
  const meta = lucroListData?.meta ?? { page: 1, pageSize: 5, totalPages: 1, totalItems: 0 };
  const totalLucro = totalData?.totalLucro ?? 0;
  const totalPendenteArrendamento = totalData?.totalPendenteArrendamento ?? 0;

  const focoArrendamento = searchParams.get("pendenteArrendamento") === "1";
  const fazendaIdNotificacao = searchParams.get("fazendaId");

  useEffect(() => {
    if (!fazendaIdNotificacao || !isAdmin) return;
    setDraftFilters((prev) => ({ ...prev, fazendaId: fazendaIdNotificacao }));
    setAppliedFilters((prev) => ({ ...prev, fazendaId: fazendaIdNotificacao }));
    setFiltersDirty(false);
    setPage(1);
  }, [fazendaIdNotificacao, isAdmin]);

  useEffect(() => {
    if (!lucrosListaErro || !erroListaLucros) return;
    notify.error(getApiErrorMessage(erroListaLucros, "Não foi possível carregar os lucros."), { id: "lucros-lista" });
  }, [lucrosListaErro, erroListaLucros]);

  const ESTOQUE_PAGE_SIZE = 100;

  function aplicarSaldosEstoque(estoque) {
    const saldos = {};
    (estoque?.items ?? []).forEach((item) => {
      if (item.colheitaId) saldos[item.colheitaId] = Number(item.emEstoque ?? 0);
    });
    setSaldosPorColheita(saldos);
    setSaldosEstoqueCarregados(true);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [faz, cult, col] = await Promise.all([
          listarFazendas(),
          listarCulturas(),
          listarColheitas(),
        ]);
        if (!active) return;
        const fazendasLista = Array.isArray(faz) ? faz : [];
        setFazendas(
          isAdmin
            ? fazendasLista
            : fazendasLista.filter((f) => fazendasVinculadasIds.has(f.id)),
        );
        setCulturas(Array.isArray(cult) ? cult : []);
        setColheitas(Array.isArray(col) ? col : []);
      } catch (error) {
        if (!active) return;
        notify.error(getApiErrorMessage(error, "Não foi possível carregar fazendas, culturas ou colheitas."));
      }

      try {
        const estoque = await listarEstoque(
          isAdmin ? { fazendaId: "all", page: 1, pageSize: ESTOQUE_PAGE_SIZE } : { page: 1, pageSize: ESTOQUE_PAGE_SIZE },
        );
        if (!active) return;
        aplicarSaldosEstoque(estoque);
      } catch (error) {
        if (!active) return;
        setSaldosEstoqueCarregados(true);
        notify.error(getApiErrorMessage(error, "Não foi possível carregar o estoque para o formulário."));
      }
    })();
    return () => { active = false; };
  }, [isAdmin, fazendasVinculadasIds]);

  async function recarregarSaldosEstoque() {
    try {
      const estoque = await listarEstoque(
        isAdmin ? { fazendaId: "all", page: 1, pageSize: ESTOQUE_PAGE_SIZE } : { page: 1, pageSize: ESTOQUE_PAGE_SIZE },
      );
      aplicarSaldosEstoque(estoque);
    } catch {
      /* mantém saldos anteriores */
    }
  }

  useEffect(() => {
    if (modalNovoOpen || modalEdicaoOpen) {
      recarregarSaldosEstoque();
    }
  }, [modalNovoOpen, modalEdicaoOpen]);

  const fazendasVinculadas = useMemo(
    () => fazendas.filter((f) => fazendasVinculadasIds.has(f.id)),
    [fazendas, fazendasVinculadasIds],
  );

  const fazendasParaFiltro = isAdmin ? fazendas : fazendasVinculadas;
  const fazendasOperacionais = useMemo(
    () => fazendas.filter((f) => f.tipo !== "ARRENDADA_PARA_TERCEIROS"),
    [fazendas],
  );
  const fazendasParaForm = isAdmin
    ? fazendasOperacionais
    : fazendasVinculadas.filter((f) => f.tipo !== "ARRENDADA_PARA_TERCEIROS");

  function handleDraftChange(field, value) {
    setDraftFilters((prev) => ({ ...prev, [field]: value }));
    setFiltersDirty(true);
  }

  function handleFiltrar() {
    setAppliedFilters({ ...draftFilters });
    setFiltersDirty(false);
    setPage(1);
  }

  function handleLimparFiltros() {
    const empty = { fazendaId: "", culturaId: "", from: "", to: "" };
    setDraftFilters(empty);
    setAppliedFilters(empty);
    setFiltersDirty(false);
    setPage(1);
  }

  const defaultFilters = useMemo(
    () => ({ fazendaId: "", culturaId: "", from: "", to: "" }),
    [],
  );

  const draftSignature = JSON.stringify(draftFilters);
  const appliedSignature = JSON.stringify(appliedFilters);
  const defaultSignature = JSON.stringify(defaultFilters);
  const hasApplied = appliedSignature !== defaultSignature;
  const canClear = hasApplied && draftSignature === appliedSignature;

  function handleFilterCta() {
    if (canClear) {
      handleLimparFiltros();
      return;
    }

    handleFiltrar();
  }

  function getPresetFazenda() {
    if (isAdmin) return null;
    if (fazendasVinculadas.length === 1) return fazendasVinculadas[0];
    return null;
  }

  function handleAbrirNovo() {
    const form = emptyLucroForm();
    const preset = getPresetFazenda();
    if (preset) form.fazendaId = preset.id;
    setNovoForm(form);
    setModalNovoOpen(true);
  }

  async function handleCriarLucro() {
    try {
      await createMutation.mutateAsync({
        colheitaId: novoForm.colheitaId,
        quantidadeSacas: Number(novoForm.quantidadeSacas),
        valorUnitario: Number(novoForm.valorUnitario),
        comprador: novoForm.comprador,
        data: novoForm.data,
      });
      setModalNovoOpen(false);
      setNovoForm(emptyLucroForm());
      await recarregarSaldosEstoque();
    } catch {
      /* toast via apiErrorToast */
    }
  }

  async function handleSalvarEdicao() {
    if (!edicaoId) return;
    try {
      await updateMutation.mutateAsync({
        id: edicaoId,
        payload: {
          colheitaId: edicaoForm.colheitaId || undefined,
          quantidadeSacas: edicaoForm.quantidadeSacas ? Number(edicaoForm.quantidadeSacas) : undefined,
          valorUnitario: edicaoForm.valorUnitario ? Number(edicaoForm.valorUnitario) : undefined,
          comprador: edicaoForm.comprador || undefined,
          data: edicaoForm.data || undefined,
        },
      });
      setModalEdicaoOpen(false);
      setEdicaoId(null);
      setEdicaoForm(emptyLucroForm());
      await recarregarSaldosEstoque();
    } catch {
      /* toast via apiErrorToast */
    }
  }

  async function handleConfirmarExclusao() {
    if (!lucroParaExcluir) return;
    try {
      await deleteMutation.mutateAsync(lucroParaExcluir.id);
      setLucroParaExcluir(null);
      await recarregarSaldosEstoque();
    } catch {
      /* toast via apiErrorToast */
    }
  }

  async function handleMarcarRecebimento(id, status) {
    setRecebimentoBusyId(id);
    try {
      await recebimentoMutation.mutateAsync({ id, status });
    } catch {
      /* toast via mutation */
    } finally {
      setRecebimentoBusyId(null);
    }
  }

  function handleEditar(row) {
    setEdicaoId(row.id);
    setEdicaoForm({
      fazendaId: row.fazenda?.id ?? "",
      culturaId: row.cultura?.id ?? "",
      colheitaId: row.colheitaId ?? "",
      quantidadeSacas: String(row.quantidadeSacas ?? ""),
      valorUnitario: String(row.valorUnitario ?? ""),
      comprador: row.comprador ?? "",
      data: row.data ?? "",
    });
    setModalEdicaoOpen(true);
  }

  return (
    <MainLayout>
      <DeleteLucroModal
        open={!!lucroParaExcluir}
        lucro={lucroParaExcluir}
        onClose={() => setLucroParaExcluir(null)}
        onConfirm={handleConfirmarExclusao}
        loading={deleteMutation.isPending}
      />

      <LucroFormModal
        open={modalNovoOpen}
        onClose={() => {
          setModalNovoOpen(false);
          setNovoForm(emptyLucroForm());
        }}
        form={novoForm}
        setForm={setNovoForm}
        onSubmit={handleCriarLucro}
        title="Novo lucro"
        submitLabel="Salvar"
        loading={createMutation.isPending}
        colheitas={colheitas}
        fazendas={fazendasParaForm}
        fazendaPreset={getPresetFazenda()}
        isAdmin={isAdmin}
        saldosPorColheita={saldosPorColheita}
        saldosEstoqueCarregados={saldosEstoqueCarregados}
      />

      <LucroFormModal
        open={modalEdicaoOpen}
        onClose={() => {
          setModalEdicaoOpen(false);
          setEdicaoId(null);
          setEdicaoForm(emptyLucroForm());
        }}
        form={edicaoForm}
        setForm={setEdicaoForm}
        onSubmit={handleSalvarEdicao}
        title="Editar lucro"
        submitLabel="Salvar alterações"
        loading={updateMutation.isPending}
        colheitas={colheitas}
        fazendas={fazendasParaForm}
        fazendaPreset={getPresetFazenda()}
        isAdmin={isAdmin}
        saldosPorColheita={saldosPorColheita}
        saldosEstoqueCarregados={saldosEstoqueCarregados}
        isEdit
        quantidadeOriginal={edicaoForm.quantidadeSacas}
      />

      {/* ══════════════════════════════════════
          LAYOUT PRINCIPAL DA PÁGINA
      ══════════════════════════════════════ */}
        <div className="flex w-full flex-col gap-5" style={{ paddingTop: "clamp(1.2rem, 3.5vh, 2rem)" }}>
        <header className="space-y-1">
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-gray-900 md:text-[2.15rem]">Meus Lucros</h1>
          <p className="text-[0.95rem] text-gray-500">Acompanhe o desempenho financeiro das suas colheitas.</p>
        </header>

        {focoArrendamento && isAdmin ? (
          <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-900">
            <p className="font-semibold">Confirme o recebimento do arrendamento</p>
            <p className="mt-1 text-violet-800/90">
              A fazenda já está filtrada abaixo. Nas linhas de arrendamento pendentes, use os botões para marcar
              se o valor foi recebido ou não. A notificação só some depois dessa confirmação.
            </p>
          </div>
        ) : null}

        {/* ── Barra de Filtros ── */}
        <section className="flex flex-wrap items-end gap-3">
          {isAdmin ? (
            <div className="flex min-w-[11.25rem] flex-1 flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500">Fazenda</span>
              <Select
                value={draftFilters.fazendaId}
                onChange={(e) => handleDraftChange("fazendaId", e.target.value)}
                wrapperClassName="relative w-full"
                selectClassName={SELECT_CLS}
              >
                <option value="">Todas as fazendas</option>
                {fazendasParaFiltro.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </Select>
            </div>
          ) : null}

          <div className="flex min-w-[11.25rem] flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">Cultura</span>
            <Select
              value={draftFilters.culturaId}
              onChange={(e) => handleDraftChange("culturaId", e.target.value)}
              wrapperClassName="relative w-full"
              selectClassName={SELECT_CLS}
            >
              <option value="">Todas as culturas</option>
              {culturas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </div>

          <div className="flex min-w-[16rem] flex-[1.35] flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500">Período</span>
            <DateRangeFilter
              from={draftFilters.from}
              to={draftFilters.to}
              onChangeFrom={(value) => {
                setDraftFilters((prev) => ({ ...prev, from: value }));
                setFiltersDirty(true);
              }}
              onChangeTo={(value) => {
                setDraftFilters((prev) => ({ ...prev, to: value }));
                setFiltersDirty(true);
              }}
            />
          </div>

          {/* Botão único de ação dos filtros */}
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
            onClick={handleAbrirNovo}
          >
            <PlusIcon className="h-4 w-4" />
            Novo Lucro
          </button>
        </section>

        {/* ── Card Total de Lucro ── */}
        <LucroTotalCard total={totalLucro} pendenteArrendamento={totalPendenteArrendamento} />

        {isAdmin && totalPendenteArrendamento > 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Há {totalPendenteArrendamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em parcelas de
            arrendamento pendentes de confirmação. Marque <strong>Recebido</strong> ou <strong>Não recebido</strong> na tabela.
          </p>
        ) : null}

        {/* ── Tabela de Lucros ── */}
        <LucroTable
          items={items}
          onEdit={handleEditar}
          onDelete={(row) => setLucroParaExcluir(row)}
          onMarcarRecebimento={handleMarcarRecebimento}
          isAdmin={isAdmin}
          recebimentoBusyId={recebimentoBusyId}
          loading={lucrosLoading}
          meta={meta}
          onPageChange={setPage}
        />
      </div>
    </MainLayout>
  );
}
