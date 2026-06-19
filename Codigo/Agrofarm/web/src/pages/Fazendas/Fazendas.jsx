import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import { HomeIcon, LeafIcon, MapPinIcon, PlusIcon } from "../../components/ui/icons.jsx";
import AgroConfirmDialog from "../../components/dialogs/AgroConfirmDialog.jsx";
import AgroFormDialog from "../../components/dialogs/AgroFormDialog.jsx";
import FazendaFormModal from "../../components/fazenda/FazendaFormModal.jsx";
import { CREATE_BUTTON_CLASSNAME } from "../../constants/createButton.js";
import {
  useCreateFazendaMutation,
  useDeleteFazendaMutation,
  useFazendaListQuery,
  useUpdateFazendaMutation,
} from "../../queries/fazenda/useFazendaQueries.js";
import {
  useCreateCulturaMutation,
  useCulturaListQuery,
  useDeleteCulturaMutation,
  useUpdateCulturaMutation,
} from "../../queries/cultura/useCulturaQueries.js";
import { notify } from "../../lib/notify.js";
import { useAuthStore } from "../../store/authStore.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { sanitizeHexColor } from "../../utils/inputSanitize.js";
import CulturasGestaoPanel from "../../components/cultura/CulturasGestaoPanel.jsx";
import AgroDataTableFooter from "../../components/ui/DataTable/AgroDataTableFooter.jsx";
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
} from "../../components/ui/DataTable/AgroDataTable.jsx";
import { AtivaBadge, CulturaPill, TipoBadge } from "./fazendaListUi.jsx";
import FazendaStatsCards from "./FazendaStatsCards.jsx";

const PAGE_SIZE = 5;

export default function Fazendas() {
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.usuario?.role === "ADMIN");
  const {
    data: fazendasRaw,
    isError: fazendasListaErro,
    error: erroListaFazendas,
    isLoading: fazendasCarregando,
  } = useFazendaListQuery();
  const {
    data: culturasRaw,
    isError: culturasListaErro,
    error: erroListaCulturas,
    isLoading: culturasCarregando,
  } = useCulturaListQuery();

  const fazendas = useMemo(
    () => (Array.isArray(fazendasRaw) ? fazendasRaw : []),
    [fazendasRaw],
  );
  const culturas = useMemo(
    () => (Array.isArray(culturasRaw) ? culturasRaw : []),
    [culturasRaw],
  );

  const createFazenda = useCreateFazendaMutation();
  const updateFazenda = useUpdateFazendaMutation();
  const deleteFazenda = useDeleteFazendaMutation();

  const createCultura = useCreateCulturaMutation();
  const updateCultura = useUpdateCulturaMutation();
  const deleteCultura = useDeleteCulturaMutation();

  const [fazendaModalOpen, setFazendaModalOpen] = useState(false);
  const [fazendaModalTarget, setFazendaModalTarget] = useState(null);

  const [culturaModalOpen, setCulturaModalOpen] = useState(false);
  const [culturaModalMode, setCulturaModalMode] = useState("create");
  const [culturaForm, setCulturaForm] = useState({ id: null, nome: "", cor: "#2e5b47" });
  const [culturaFormError, setCulturaFormError] = useState("");

  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [fazendasPage, setFazendasPage] = useState(1);

  useEffect(() => {
    if (!fazendasListaErro || !erroListaFazendas) return;
    notify.error(getApiErrorMessage(erroListaFazendas, "Não foi possível carregar as fazendas."), { id: "fazendas-lista" });
  }, [fazendasListaErro, erroListaFazendas]);

  useEffect(() => {
    if (!culturasListaErro || !erroListaCulturas) return;
    notify.error(getApiErrorMessage(erroListaCulturas, "Não foi possível carregar o catálogo de culturas."), {
      id: "culturas-catalogo",
    });
  }, [culturasListaErro, erroListaCulturas]);

  async function handleSubmitCultura(form) {
    setCulturaFormError("");
    try {
      const payload = {
        nome: (form.nome ?? "").trim(),
        cor: form.cor,
      };
      if (culturaModalMode === "edit" && form.id) {
        await updateCultura.mutateAsync({ id: form.id, payload });
      } else {
        await createCultura.mutateAsync(payload);
      }
      setCulturaModalOpen(false);
    } catch {
      /* Erro da API: toast via React Query. */
    }
  }

  async function handleConfirmDelete() {
    if (!confirm?.action) return;
    setConfirmBusy(true);
    try {
      await confirm.action();
      setConfirm(null);
    } catch {
      /* Erro da API: toast via React Query. */
    } finally {
      setConfirmBusy(false);
    }
  }

  const fazendasTotalPages = Math.max(1, Math.ceil(fazendas.length / PAGE_SIZE));

  const pagedFazendas = useMemo(() => {
    const start = (fazendasPage - 1) * PAGE_SIZE;
    return fazendas.slice(start, start + PAGE_SIZE);
  }, [fazendas, fazendasPage]);

  useEffect(() => {
    if (fazendasPage > fazendasTotalPages) {
      setFazendasPage(fazendasTotalPages);
    }
  }, [fazendasPage, fazendasTotalPages]);

  const fazendasStart = fazendas.length === 0 ? 0 : (fazendasPage - 1) * PAGE_SIZE + 1;
  const fazendasEnd = fazendas.length === 0 ? 0 : Math.min(fazendasPage * PAGE_SIZE, fazendas.length);
  const culturaDialogTitleId = culturaModalMode === "edit" ? "editar-cultura-title" : "criar-cultura-title";

  return (
    <MainLayout>
      <FazendaFormModal
        open={fazendaModalOpen}
        fazenda={fazendaModalTarget}
        loading={createFazenda.isPending || updateFazenda.isPending}
        onClose={() => setFazendaModalOpen(false)}
        onSubmit={async (payload) => {
          if (fazendaModalTarget?.id) {
            await updateFazenda.mutateAsync({ id: fazendaModalTarget.id, payload });
          } else {
            const created = await createFazenda.mutateAsync(payload);
            navigate(`/fazendas/${created.id}`);
          }
        }}
      />

      {/* ── Modais de Cultura ── */}
      <AgroFormDialog
        open={culturaModalOpen}
        onClose={() => {
          setCulturaModalOpen(false);
          setCulturaFormError("");
        }}
        title={culturaModalMode === "edit" ? "Editar Cultura" : "Criar Cultura"}
        subtitle={culturaModalMode === "edit" ? "Edite as informações da cultura selecionada." : "Cadastre uma nova cultura para gerenciar nas suas fazendas."}
        icon={LeafIcon}
        titleId={culturaDialogTitleId}
        errorMessage={culturaFormError}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitCultura(culturaForm);
          }}
        >
          <div className="agro-user-form-dialog__grid">
            <div className="agro-user-form-dialog__field md:col-span-2">
              <label className="agro-user-form-dialog__label" htmlFor="cultura-nome">
                Nome da cultura
              </label>
              <input
                id="cultura-nome"
                type="text"
                placeholder="Nome"
                value={culturaForm.nome}
                onChange={(e) => setCulturaForm((p) => ({ ...p, nome: e.target.value.slice(0, 100) }))}
                className="usuario-form-modal-input agro-user-form-dialog__input"
                maxLength={100}
                required
              />
            </div>
            <div className="agro-user-form-dialog__field md:col-span-2">
              <label className="agro-user-form-dialog__label" htmlFor="cultura-cor-hex">
                Cor
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="color"
                  value={/^#[0-9A-F]{6}$/i.test(culturaForm.cor) ? culturaForm.cor : "#000000"}
                  onChange={(e) =>
                    setCulturaForm((p) => ({ ...p, cor: sanitizeHexColor(e.target.value.toUpperCase()) }))
                  }
                  className="h-14 w-full max-w-[8.5rem] cursor-pointer rounded-lg border border-gray-200 bg-white p-1 shadow-sm"
                  aria-label="Seletor de cor"
                />
                <input
                  id="cultura-cor-hex"
                  type="text"
                  inputMode="text"
                  spellCheck={false}
                  value={culturaForm.cor}
                  onChange={(e) => setCulturaForm((p) => ({ ...p, cor: sanitizeHexColor(e.target.value) }))}
                  className="usuario-form-modal-input agro-user-form-dialog__input max-w-md font-mono uppercase"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  maxLength={7}
                  title="Formato #RRGGBB"
                />
              </div>
            </div>
          </div>
          <div className="agro-user-form-dialog__footer">
            <Button
              type="button"
              variant="danger"
              className="w-full sm:w-auto"
              onClick={() => {
                setCulturaModalOpen(false);
                setCulturaFormError("");
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto"
              disabled={createCultura.isPending || updateCultura.isPending}
              aria-busy={createCultura.isPending || updateCultura.isPending}
            >
              {createCultura.isPending || updateCultura.isPending
                ? "Salvando…"
                : culturaModalMode === "edit"
                  ? "Editar Cultura"
                  : "Criar Cultura"}
            </Button>
          </div>
        </form>
      </AgroFormDialog>

      {/* ── Confirmação de exclusão ── */}
      <AgroConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        onClose={() => {
          if (confirmBusy) return;
          setConfirm(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={confirmBusy}
      />

      {/* ══════════════════════════════════════════════
          LAYOUT PRINCIPAL DA PÁGINA
      ══════════════════════════════════════════════ */}
      <div className="flex w-full flex-col gap-5" style={{ paddingTop: "clamp(1.2rem, 3.5vh, 2rem)" }}>

        {/* ── Cabeçalho ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <header className="space-y-1">
            <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-gray-900 md:text-[2.15rem]">Fazendas</h1>
            <p className="text-[0.95rem] text-gray-500">Gerencie suas fazendas e visualize informações gerais.</p>
          </header>
          {isAdmin && (
            <Button
              type="button"
              variant="primaryBrand"
              className={`${CREATE_BUTTON_CLASSNAME} sm:self-start`}
              onClick={() => {
                setFazendaModalTarget(null);
                setFazendaModalOpen(true);
              }}
            >
              <PlusIcon className="h-4 w-4 shrink-0" />
              Nova Fazenda
            </Button>
          )}
        </div>

        {/* ── Cards de resumo ── */}
        <FazendaStatsCards fazendas={fazendas} culturas={culturas} />

        {/* ════════════════════════════════
            SEÇÃO: MINHAS FAZENDAS
        ════════════════════════════════ */}
        <section className={agroTable.section}>
          <div className="border-b border-gray-100 px-6 pt-6 pb-4">
            <h2 className="text-base font-bold text-gray-900">Minhas Fazendas</h2>
          </div>

          <AgroDataTable
            embedded
            minWidth={900}
            footer={
              <AgroDataTableFooter
                start={fazendasStart}
                end={fazendasEnd}
                totalItems={fazendas.length}
                itemLabel={fazendas.length === 1 ? "fazenda" : "fazendas"}
                page={fazendasPage}
                totalPages={fazendasTotalPages}
                onPageChange={setFazendasPage}
              />
            }
          >
            <AgroDataTableHead>
              <AgroDataTableTh align="left">Fazenda</AgroDataTableTh>
              <AgroDataTableTh>Hectares</AgroDataTableTh>
              <AgroDataTableTh>Tipo</AgroDataTableTh>
              <AgroDataTableTh>Localização</AgroDataTableTh>
              <AgroDataTableTh align="left">Culturas</AgroDataTableTh>
              {isAdmin ? <AgroDataTableTh>Ações</AgroDataTableTh> : null}
            </AgroDataTableHead>

            <AgroDataTableBody>
              {pagedFazendas.length === 0 ? (
                <AgroDataTableEmpty colSpan={isAdmin ? 6 : 5}>
                  Nenhuma fazenda cadastrada.
                </AgroDataTableEmpty>
              ) : (
                pagedFazendas.map((f) => (
                  <AgroDataTableRow key={f.id} onClick={() => navigate(`/fazendas/${f.id}`)}>
                    <AgroDataTableTd align="left">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
                          <HomeIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{f.nome}</p>
                          <div className="mt-1">
                            <AtivaBadge ativa={f.ativa} />
                          </div>
                        </div>
                      </div>
                    </AgroDataTableTd>
                    <AgroDataTableTd className="tabular-nums">
                      <span title="Hectares mapeados no mapa">
                        {Number(f.hectaresMapeados ?? 0).toLocaleString("pt-BR")} ha
                      </span>
                      <span className="block text-xs text-gray-500">
                        culturas: {Number(f.hectares ?? 0).toLocaleString("pt-BR")} ha
                      </span>
                    </AgroDataTableTd>
                    <AgroDataTableTd>
                      <div className="flex justify-center">
                        <TipoBadge tipo={f.tipo} />
                      </div>
                    </AgroDataTableTd>
                    <AgroDataTableTd>
                      {f.localizacao ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-green-600" />
                          <span className="text-sm text-gray-700">{f.localizacao}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </AgroDataTableTd>
                    <AgroDataTableTd align="left">
                      <div className="flex flex-wrap justify-start gap-1">
                        {(f.culturas ?? [])
                          .map((v) => v.cultura)
                          .filter(Boolean)
                          .sort((a, b) =>
                            (a.nome ?? "").localeCompare(b.nome ?? "", "pt", { sensitivity: "base" }),
                          )
                          .map((c) => (
                            <CulturaPill key={c.id} nome={c.nome} cor={c.cor} />
                          ))}
                      </div>
                    </AgroDataTableTd>
                    {isAdmin && (
                      <AgroDataTableTd onClick={(e) => e.stopPropagation()}>
                        <AgroDataTableActions>
                          <AgroDataTableEditButton
                            label={`Editar ${f.nome}`}
                            onClick={() => {
                              setFazendaModalTarget(f);
                              setFazendaModalOpen(true);
                            }}
                          />
                          <AgroDataTableDeleteButton
                            label={`Excluir ${f.nome}`}
                            onClick={() =>
                              setConfirm({
                                title: "Excluir fazenda",
                                message: `Deseja excluir a fazenda ${f.nome}?`,
                                description: "Esta ação não pode ser desfeita.",
                                confirmLabel: "Excluir",
                                action: async () => deleteFazenda.mutateAsync(f.id),
                              })
                            }
                          />
                        </AgroDataTableActions>
                      </AgroDataTableTd>
                    )}
                  </AgroDataTableRow>
                ))
              )}
            </AgroDataTableBody>
          </AgroDataTable>
        </section>

        <CulturasGestaoPanel
          variant="global"
          culturas={culturas}
          fazendas={fazendas}
          loading={culturasCarregando || fazendasCarregando}
          isAdmin={isAdmin}
          onCreateCatalog={() => {
            setCulturaModalMode("create");
            setCulturaForm({ id: null, nome: "", cor: "#2e5b47" });
            setCulturaFormError("");
            setCulturaModalOpen(true);
          }}
          onEditCatalog={(c) => {
            setCulturaModalMode("edit");
            setCulturaForm({
              id: c.id,
              nome: c.nome ?? "",
              cor: c.cor ?? "#2e5b47",
            });
            setCulturaFormError("");
            setCulturaModalOpen(true);
          }}
          onDeleteCatalog={(c) =>
            setConfirm({
              title: "Excluir cultura",
              message: `Deseja excluir a cultura ${c.nome}?`,
              description: "Esta ação não pode ser desfeita.",
              confirmLabel: "Excluir",
              action: async () => deleteCultura.mutateAsync(c.id),
            })
          }
        />
      </div>
    </MainLayout>
  );
}
