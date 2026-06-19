import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout.jsx";
import Button from "../../components/ui/Button/Button.jsx";
import { PencilIcon } from "../../components/ui/icons.jsx";
import CulturasGestaoPanel from "../../components/cultura/CulturasGestaoPanel.jsx";
import FazendaCulturaVinculoModal from "../../components/fazenda/FazendaCulturaVinculoModal.jsx";
import FazendaFormModal from "../../components/fazenda/FazendaFormModal.jsx";
import AgroConfirmDialog from "../../components/dialogs/AgroConfirmDialog.jsx";
import { useCulturaListQuery } from "../../queries/cultura/useCulturaQueries.js";
import { usePageBreadcrumbs } from "../../hooks/usePageBreadcrumbs.js";
import FazendaDetalheKpiCards from "../../components/fazenda/FazendaDetalheKpiCards.jsx";
import FazendaVisaoGeral from "../../components/fazenda/FazendaVisaoGeral.jsx";
import {
  useFazendaByIdQuery,
  useFazendaDetalheQuery,
  useAddCulturaNaFazendaMutation,
  useCulturasDaFazendaQuery,
  useDeleteCulturaDaFazendaMutation,
  useUpdateCulturaDaFazendaMutation,
  useUpdateFazendaMutation,
} from "../../queries/fazenda/useFazendaQueries.js";
import { notify } from "../../lib/notify.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { useAuthStore } from "../../store/authStore.js";
import { AtivaBadge, SomenteLeituraBadge, TipoBadge } from "./fazendaListUi.jsx";
import { FAZENDA_SOMENTE_LEITURA_TOOLTIP, podeOperarFazenda } from "../../utils/fazendaOperacao.js";
import MapView from "./MapView.jsx";
import FazendaHistoricoPanel from "../../components/fazenda/FazendaHistoricoPanel.jsx";

const TABS = [
  { id: "visao-geral", label: "Visão geral" },
  { id: "culturas", label: "Culturas" },
  { id: "mapa", label: "Mapa" },
  { id: "historico", label: "Histórico" },
];

export default function FazendaDetalhe() {
  const { id } = useParams();
  const isAdmin = useAuthStore((s) => s.usuario?.role === "ADMIN");
  const [abaAtiva, setAbaAtiva] = useState("visao-geral");

  const { data: fazenda, isLoading: fazendaCarregando, isError: fazendaErro, error: erroFazenda } = useFazendaByIdQuery(id);
  const {
    data: detalhe,
    isLoading: detalheCarregando,
    isError: detalheErro,
    error: erroDetalhe,
  } = useFazendaDetalheQuery(id);
  const {
    data: vinculos = [],
    isLoading: culturasCarregando,
    isError: vinculosErro,
    error: erroVinculos,
  } = useCulturasDaFazendaQuery(id);
  const { data: culturas = [], isError: culturasCatalogoErro, error: erroCatalogoCulturas } = useCulturaListQuery();

  const updateFazenda = useUpdateFazendaMutation();
  const addCultura = useAddCulturaNaFazendaMutation();
  const updateCultura = useUpdateCulturaDaFazendaMutation();
  const deleteCultura = useDeleteCulturaDaFazendaMutation();

  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [editFazendaOpen, setEditFazendaOpen] = useState(false);

  const [culturaModalOpen, setCulturaModalOpen] = useState(false);
  const [culturaModalMode, setCulturaModalMode] = useState("create");
  const [vinculoEmEdicao, setVinculoEmEdicao] = useState(null);
  const [culturaPendente, setCulturaPendente] = useState(null);
  const tituloFazenda = fazenda?.nome?.trim() || "Fazenda";
  const breadcrumbItems = useMemo(
    () => [
      { label: "Fazendas", to: "/fazendas" },
      { label: tituloFazenda },
    ],
    [tituloFazenda],
  );
  usePageBreadcrumbs(breadcrumbItems);
  const podeOperar = podeOperarFazenda(fazenda);
  const bloqueioTitulo = !podeOperar ? FAZENDA_SOMENTE_LEITURA_TOOLTIP : undefined;

  useEffect(() => {
    if (!fazendaErro || !erroFazenda) return;
    notify.error(getApiErrorMessage(erroFazenda, "Não foi possível carregar a fazenda."), { id: "fazenda-detalhe-load" });
  }, [fazendaErro, erroFazenda]);

  useEffect(() => {
    if (!detalheErro || !erroDetalhe) return;
    notify.error(getApiErrorMessage(erroDetalhe, "Não foi possível carregar o resumo da fazenda."), {
      id: "fazenda-detalhe-resumo",
    });
  }, [detalheErro, erroDetalhe]);

  useEffect(() => {
    if (!vinculosErro || !erroVinculos) return;
    notify.error(getApiErrorMessage(erroVinculos, "Não foi possível carregar as culturas desta fazenda."), {
      id: "fazenda-detalhe-vinculos",
    });
  }, [vinculosErro, erroVinculos]);

  useEffect(() => {
    if (!culturasCatalogoErro || !erroCatalogoCulturas) return;
    notify.error(getApiErrorMessage(erroCatalogoCulturas, "Não foi possível carregar o catálogo de culturas."), {
      id: "fazenda-detalhe-catalogo-culturas",
    });
  }, [culturasCatalogoErro, erroCatalogoCulturas]);

  useEffect(() => {
    if (abaAtiva !== "culturas" || !culturaPendente) return;
    setCulturaModalMode("create");
    setVinculoEmEdicao(null);
    setCulturaModalOpen(true);
  }, [abaAtiva, culturaPendente]);

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

  return (
    <MainLayout>
      <AgroConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? "Confirmar exclusão"}
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

      {isAdmin ? (
        <FazendaFormModal
          open={editFazendaOpen}
          fazenda={fazenda}
          loading={updateFazenda.isPending}
          onClose={() => setEditFazendaOpen(false)}
          onSubmit={(payload) => updateFazenda.mutateAsync({ id, payload })}
        />
      ) : null}

      <FazendaCulturaVinculoModal
        open={culturaModalOpen}
        mode={culturaModalMode}
        fazendaId={id}
        culturas={culturas}
        vinculo={vinculoEmEdicao}
        culturaInicial={culturaPendente ?? ""}
        loading={addCultura.isPending || updateCultura.isPending}
        onClose={() => {
          setCulturaModalOpen(false);
          setVinculoEmEdicao(null);
          setCulturaPendente(null);
        }}
        onIrParaMapa={(culturaId) => {
          setCulturaPendente(culturaId);
          setCulturaModalOpen(false);
          setAbaAtiva("mapa");
        }}
        onSubmit={async ({ culturaId, status }) => {
          if (culturaModalMode === "edit" && vinculoEmEdicao?.id) {
            await updateCultura.mutateAsync({
              fazendaId: id,
              vinculoId: vinculoEmEdicao.id,
              payload: { status },
            });
          } else {
            await addCultura.mutateAsync({
              fazendaId: id,
              payload: { culturaId, status },
            });
          }
          setCulturaPendente(null);
        }}
      />

      <div
        className={`flex w-full flex-col ${abaAtiva === "mapa" ? "gap-3" : "gap-5"}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex flex-wrap items-center gap-3">
            <h1 className="min-w-0 text-2xl font-bold tracking-tight text-gray-900 md:text-[1.75rem]">
              {fazendaCarregando ? (
                <span className="inline-block h-9 w-[min(100%,14rem)] animate-pulse rounded-md bg-gray-200/90" aria-hidden />
              ) : (
                <span className="break-words">{tituloFazenda}</span>
              )}
            </h1>
            {!fazendaCarregando && fazenda ? (
              <div className="flex flex-wrap items-center gap-2">
                <AtivaBadge ativa={fazenda.ativa} />
                <TipoBadge tipo={fazenda.tipo} />
                {!podeOperar ? <SomenteLeituraBadge /> : null}
              </div>
            ) : null}
          </div>
          {isAdmin ? (
            <Button
              type="button"
              variant="outline"
              className="inline-flex shrink-0 items-center gap-2 self-start"
              title={bloqueioTitulo}
              disabled={fazendaCarregando || fazendaErro || !fazenda}
              onClick={() => setEditFazendaOpen(true)}
            >
              <PencilIcon className="h-4 w-4" />
              Editar fazenda
            </Button>
          ) : null}
        </div>

        <FazendaDetalheKpiCards
          kpis={
            detalhe?.kpis ??
            (detalheErro && !detalheCarregando
              ? {
                  culturasAtivas: vinculos.length,
                  talhoesMapeados: 0,
                  areasNoHistorico: 0,
                  produtividadeMedia: 0,
                  funcionariosVinculados: 0,
                }
              : undefined)
          }
          loading={fazendaCarregando || detalheCarregando}
        />

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs da fazenda">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAbaAtiva(tab.id)}
                className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                  abaAtiva === tab.id
                    ? "border-[var(--agro-brand)] text-[var(--agro-brand)]"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {abaAtiva === "visao-geral" && (
          <FazendaVisaoGeral
            fazendaId={id}
            detalhe={detalhe ?? fazenda}
            vinculos={vinculos}
            loading={fazendaCarregando || detalheCarregando}
            onGerenciarCulturas={() => setAbaAtiva("culturas")}
            onVerHistorico={() => setAbaAtiva("historico")}
          />
        )}

        {/* Conteúdo: Culturas */}
        {abaAtiva === "culturas" && (
          <CulturasGestaoPanel
            variant="fazenda"
            vinculos={vinculos}
            loading={culturasCarregando}
            podeOperar={podeOperar && !fazendaCarregando && !fazendaErro}
            bloqueioTitulo={bloqueioTitulo}
            onAddVinculo={() => {
              setCulturaModalMode("create");
              setVinculoEmEdicao(null);
              setCulturaModalOpen(true);
            }}
            onEditVinculo={(v) => {
              setCulturaModalMode("edit");
              setVinculoEmEdicao(v);
              setCulturaModalOpen(true);
            }}
            onDeleteVinculo={(v) =>
              setConfirm({
                title: "Excluir cultura",
                message: `Deseja excluir a cultura ${v.cultura?.nome ?? ""} desta fazenda?`,
                description: "Esta ação não pode ser desfeita.",
                confirmLabel: "Excluir",
                action: async () => deleteCultura.mutateAsync({ fazendaId: id, vinculoId: v.id }),
              })
            }
          />
        )}

        {abaAtiva === "mapa" && <MapView fazendaId={id} fazenda={fazenda} />}

        {abaAtiva === "historico" && (
          <FazendaHistoricoPanel
            fazendaId={id}
            podeOperar={podeOperar && isAdmin}
            bloqueioTitulo={bloqueioTitulo}
            onVerMapa={() => setAbaAtiva("mapa")}
          />
        )}
      </div>
    </MainLayout>
  );
}
