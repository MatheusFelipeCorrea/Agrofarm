import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BadgeDollarSign, Info } from "lucide-react";
import Button from "../ui/Button/Button.jsx";
import AgroFormDialog from "../dialogs/AgroFormDialog.jsx";
import Select from "../ui/Select/Select.jsx";
import DatePickerInput from "../ui/DatePickerInput.jsx";
import { formatNumberPtBR } from "../../utils/formatters.js";
import { useCulturasDaFazendaQuery } from "../../queries/fazenda/useFazendaQueries.js";
import {
  FAZENDA_SEM_CULTURAS_VINCULADAS_LUCRO_MENSAGEM,
  FAZENDA_SOMENTE_LEITURA_MENSAGEM,
  podeOperarFazenda,
} from "../../utils/fazendaOperacao.js";

const FIELD_INPUT = "agro-user-form-dialog__input";
const FIELD_LABEL = "agro-user-form-dialog__label";

function FieldWrapper({ label, children, hint }) {
  return (
    <div className="flex w-full flex-col">
      <span className={FIELD_LABEL}>{label}</span>
      <div className="relative">{children}</div>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

function formatSacas(value) {
  return formatNumberPtBR(value, { maximumFractionDigits: 2 });
}

function rotuloColheitaCurto(colheita) {
  const cultura = colheita?.cultura?.nome;
  const ano = colheita?.ano ?? "—";
  return cultura ? `${cultura} · Safra ${ano}` : `Safra ${ano}`;
}

function ColheitaResumoCard({ colheita, saldoBruto, saldosCarregados }) {
  if (!colheita) return null;

  const produzidas = Number(colheita.sacasProduzidas ?? 0);
  const saldo =
    saldoBruto == null && saldosCarregados ? 0 : saldoBruto;

  return (
    <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-[#d8e9de] bg-[#f8fcf9] p-3 text-sm">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Produzidas</p>
        <p className="mt-0.5 font-semibold tabular-nums text-slate-800">{formatSacas(produzidas)} sacas</p>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Em estoque</p>
        {!saldosCarregados ? (
          <p className="mt-0.5 text-xs text-amber-700">Atualizando…</p>
        ) : (
          <p className={`mt-0.5 font-semibold tabular-nums ${saldo > 0 ? "text-[#1f4f38]" : "text-red-600"}`}>
            {formatSacas(saldo)} sacas
          </p>
        )}
      </div>
    </div>
  );
}

const ALERTA_ESTILOS = {
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

function CampoAlerta({ tipo = "error", children }) {
  const Icon = tipo === "info" ? Info : AlertCircle;
  return (
    <p
      role="alert"
      className={`mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-snug ${ALERTA_ESTILOS[tipo] ?? ALERTA_ESTILOS.error}`}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export default function LucroFormModal({
  open,
  onClose,
  title,
  submitLabel,
  loading,
  form,
  setForm,
  onSubmit,
  colheitas,
  fazendas,
  fazendaPreset,
  isAdmin,
  saldosPorColheita = {},
  saldosEstoqueCarregados = false,
  quantidadeOriginal = 0,
  isEdit = false,
}) {
  const [quantidadeTouched, setQuantidadeTouched] = useState(false);

  useEffect(() => {
    if (open) setQuantidadeTouched(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const fazendaEfetiva = isAdmin ? form.fazendaId : (fazendaPreset?.id ?? fazendas[0]?.id ?? "");

  const fazendaSelecionada = useMemo(
    () => (fazendas ?? []).find((f) => f.id === fazendaEfetiva) ?? null,
    [fazendas, fazendaEfetiva],
  );

  const fazendaSomenteLeitura = Boolean(
    fazendaEfetiva && !podeOperarFazenda(fazendaSelecionada),
  );

  const { data: culturasDaFazenda = [], isFetched: culturasDaFazendaCarregadas } = useCulturasDaFazendaQuery(
    fazendaEfetiva,
    {
      enabled: open && Boolean(fazendaEfetiva) && !fazendaSomenteLeitura,
    },
  );

  const culturasVinculadas = useMemo(() => {
    if (!fazendaEfetiva) return [];

    const mapa = new Map();

    (culturasDaFazenda ?? []).forEach((vinculo) => {
      const cultura = vinculo?.cultura;
      if (cultura?.id) {
        mapa.set(cultura.id, cultura);
      }
    });

    return Array.from(mapa.values());
  }, [culturasDaFazenda, fazendaEfetiva]);

  const semCulturasVinculadas = Boolean(
    fazendaEfetiva
    && !fazendaSomenteLeitura
    && culturasDaFazendaCarregadas
    && culturasVinculadas.length === 0,
  );

  const bloqueioOperacional = fazendaSomenteLeitura || semCulturasVinculadas;

  const mensagemBloqueio = fazendaSomenteLeitura
    ? FAZENDA_SOMENTE_LEITURA_MENSAGEM
    : semCulturasVinculadas
      ? FAZENDA_SEM_CULTURAS_VINCULADAS_LUCRO_MENSAGEM
      : undefined;

  useEffect(() => {
    if (!open || !bloqueioOperacional) return;
    if (form.culturaId || form.colheitaId) {
      setForm((prev) => ({ ...prev, culturaId: "", colheitaId: "" }));
    }
  }, [open, bloqueioOperacional, form.culturaId, form.colheitaId, setForm]);

  const colheitasDaFazenda = useMemo(() => {
    const base = isAdmin ? colheitas : colheitas.filter((c) => fazendas.some((f) => f.id === c.fazenda?.id));
    return fazendaEfetiva ? base.filter((c) => c.fazenda?.id === fazendaEfetiva) : base;
  }, [colheitas, fazendas, fazendaEfetiva, isAdmin]);

  const culturasDisponiveis = useMemo(() => {
    const mapa = new Map();
    colheitasDaFazenda.forEach((c) => {
      if (c.cultura && !mapa.has(c.cultura.id)) mapa.set(c.cultura.id, c.cultura);
    });
    return Array.from(mapa.values());
  }, [colheitasDaFazenda]);

  const colheitasDaCultura = useMemo(() => {
    if (!form.culturaId) return [];
    return colheitasDaFazenda.filter((c) => c.cultura?.id === form.culturaId);
  }, [colheitasDaFazenda, form.culturaId]);

  const colheitaSelecionada = useMemo(
    () => colheitas.find((c) => c.id === form.colheitaId) ?? null,
    [colheitas, form.colheitaId],
  );

  const saldoBrutoColheita = useMemo(() => {
    if (!form.colheitaId) return null;
    const emEstoque = saldosPorColheita[form.colheitaId];
    if (emEstoque == null) {
      return saldosEstoqueCarregados ? 0 : null;
    }
    return Number(emEstoque);
  }, [form.colheitaId, saldosPorColheita, saldosEstoqueCarregados]);

  const saldoDisponivel = useMemo(() => {
    if (saldoBrutoColheita == null) return null;
    const margemEdicao = isEdit ? Number(quantidadeOriginal) || 0 : 0;
    return saldoBrutoColheita + margemEdicao;
  }, [saldoBrutoColheita, isEdit, quantidadeOriginal]);

  function escolherMelhorColheita(culturaId) {
    const candidatas = colheitasDaFazenda.filter((c) => c.cultura?.id === culturaId);
    if (!candidatas.length) return null;

    return candidatas.reduce((melhor, atual) => {
      const saldoAtual = Number(saldosPorColheita[atual.id] ?? 0);
      const saldoMelhor = Number(saldosPorColheita[melhor.id] ?? 0);
      return saldoAtual > saldoMelhor ? atual : melhor;
    });
  }

  function handleCulturaChange(culturaId) {
    const colheita = escolherMelhorColheita(culturaId);
    setForm((prev) => ({ ...prev, culturaId, colheitaId: colheita?.id ?? "" }));
  }

  function handleColheitaChange(colheitaId) {
    const colheita = colheitas.find((c) => c.id === colheitaId);
    setForm((prev) => ({
      ...prev,
      colheitaId,
      culturaId: colheita?.cultura?.id ?? prev.culturaId,
    }));
  }

  function handleFazendaChange(fazendaId) {
    setForm((prev) => ({ ...prev, fazendaId, culturaId: "", colheitaId: "" }));
  }

  const isFormValid = useMemo(() => {
    const quantidade = Number(form.quantidadeSacas);
    const estoqueOk =
      saldoDisponivel != null &&
      saldoDisponivel > 0 &&
      Number.isFinite(quantidade) &&
      quantidade > 0 &&
      quantidade <= saldoDisponivel;

    return Boolean(
      form.colheitaId &&
      estoqueOk &&
      form.valorUnitario &&
      Number(form.valorUnitario) > 0 &&
      form.comprador?.trim().length >= 2 &&
      form.data,
    );
  }, [form, saldoDisponivel]);

  const feedbackFormulario = useMemo(() => {
    const quantidade = Number(form.quantidadeSacas);
    const qtdInformada = String(form.quantidadeSacas ?? "").trim() !== "";

    let alertaQuantidade = null;

    if (!form.colheitaId) {
      if (qtdInformada) {
        alertaQuantidade = {
          tipo: "warning",
          mensagem: "Selecione a fazenda e a cultura antes de informar a quantidade vendida.",
        };
      }
    } else if (saldoDisponivel == null) {
      alertaQuantidade = {
        tipo: "warning",
        mensagem: "Carregando o estoque disponível para esta colheita...",
      };
    } else if (saldoDisponivel <= 0) {
      alertaQuantidade = {
        tipo: "error",
        mensagem:
          "Não há sacas em estoque para esta colheita. Escolha outro lote ou registre a produção na colheita antes de vender.",
      };
    } else if (qtdInformada) {
      if (!Number.isFinite(quantidade) || quantidade <= 0) {
        alertaQuantidade = {
          tipo: "error",
          mensagem: "A quantidade vendida deve ser maior que zero.",
        };
      } else if (quantidade > saldoDisponivel) {
        alertaQuantidade = {
          tipo: "error",
          mensagem: `Você informou ${formatSacas(quantidade)} sacas, mas só há ${formatSacas(saldoDisponivel)} disponíveis em estoque. Ajuste a quantidade para continuar.`,
        };
      }
    }

    let motivoSalvarDesabilitado = null;

    if (alertaQuantidade?.tipo === "error") {
      motivoSalvarDesabilitado = alertaQuantidade.mensagem;
    } else if (!form.colheitaId) {
      motivoSalvarDesabilitado = "Selecione a fazenda e a cultura para registrar a venda.";
    } else if (saldoDisponivel != null && saldoDisponivel <= 0) {
      motivoSalvarDesabilitado = "Não é possível vender: não há sacas em estoque nesta colheita.";
    } else if (!qtdInformada || !Number.isFinite(quantidade) || quantidade <= 0) {
      motivoSalvarDesabilitado = "Informe a quantidade de sacas vendidas.";
    } else if (quantidade > (saldoDisponivel ?? 0)) {
      motivoSalvarDesabilitado = `Quantidade acima do estoque (máximo: ${formatSacas(saldoDisponivel)} sacas).`;
    } else if (!form.valorUnitario || Number(form.valorUnitario) <= 0) {
      motivoSalvarDesabilitado = "Informe o valor unitário da saca.";
    } else if (!form.comprador?.trim() || form.comprador.trim().length < 2) {
      motivoSalvarDesabilitado = "Informe o comprador com pelo menos 2 caracteres.";
    } else if (!form.data) {
      motivoSalvarDesabilitado = "Informe a data da venda.";
    }

    const exibirAlertaQuantidade = Boolean(
      alertaQuantidade &&
      (
        alertaQuantidade.tipo === "error" ||
        quantidadeTouched ||
        qtdInformada
      ),
    );

    return { alertaQuantidade, motivoSalvarDesabilitado, exibirAlertaQuantidade };
  }, [form, saldoDisponivel, saldosEstoqueCarregados, quantidadeTouched]);

  const inputQuantidadeInvalido =
    feedbackFormulario.alertaQuantidade?.tipo === "error" &&
    feedbackFormulario.exibirAlertaQuantidade;

  const precisaSelecionarFazenda = isAdmin && !fazendaEfetiva;
  const exibirSeletorColheita = colheitasDaCultura.length > 1;

  useEffect(() => {
    if (!open || !form.culturaId || form.colheitaId) return;
    if (colheitasDaCultura.length !== 1) return;
    const unica = colheitasDaCultura[0];
    if (unica?.id && unica.id !== form.colheitaId) {
      setForm((prev) => ({ ...prev, colheitaId: unica.id }));
    }
  }, [open, form.culturaId, form.colheitaId, colheitasDaCultura, setForm]);

  if (!open) return null;

  return (
    <AgroFormDialog
      open={open}
      onClose={onClose}
      title={title}
      subtitle={title?.toLowerCase().includes("edit") ? "Atualize as informações do lucro selecionado." : "Cadastre um novo lucro para acompanhar os ganhos da fazenda."}
      icon={BadgeDollarSign}
      titleId="lucro-form-title"
      errorMessage={mensagemBloqueio}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (bloqueioOperacional) return;
          onSubmit();
        }}
        noValidate
      >
        <div className="agro-user-form-dialog__grid">
          <FieldWrapper label="Selecione uma Fazenda:">
            {isAdmin ? (
              <Select
                value={form.fazendaId}
                onChange={(e) => handleFazendaChange(e.target.value)}
                placeholder="Selecione uma Fazenda"
              >
                {fazendas.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </Select>
            ) : (
              <div className="agro-user-form-dialog__input flex items-center bg-gray-100 text-gray-600">
                {fazendaPreset?.nome ?? fazendas[0]?.nome ?? "—"}
              </div>
            )}
          </FieldWrapper>

          {!bloqueioOperacional ? (
            <>
          <FieldWrapper label="Selecione uma cultura:">
            <div className="group relative">
              <Select
                value={form.culturaId}
                onChange={(e) => handleCulturaChange(e.target.value)}
                placeholder={precisaSelecionarFazenda ? "Selecione a fazenda" : "Cultura"}
                disabled={precisaSelecionarFazenda}
              >
                {culturasDisponiveis.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </Select>
              {precisaSelecionarFazenda && (
                <div className="invisible absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-2 text-xs text-white group-hover:visible">
                  Selecione uma fazenda primeiro
                </div>
              )}
            </div>
          </FieldWrapper>

          {(exibirSeletorColheita || (form.culturaId && colheitasDaCultura.length === 1)) ? (
            <div className="md:col-span-2">
            <FieldWrapper
              label={exibirSeletorColheita ? "Colheita (lote)" : "Colheita (lote) da cultura"}
            >
              {exibirSeletorColheita ? (
                <Select
                  value={form.colheitaId}
                  onChange={(e) => handleColheitaChange(e.target.value)}
                  placeholder="Selecione a safra / lote"
                  wrapperClassName="relative w-full"
                >
                  {colheitasDaCultura.map((c) => (
                    <option key={c.id} value={c.id}>
                      {rotuloColheitaCurto(c)}
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="agro-user-form-dialog__input flex items-center bg-gray-50 font-medium text-gray-800">
                  {rotuloColheitaCurto(colheitasDaCultura[0])}
                </div>
              )}
              <ColheitaResumoCard
                colheita={colheitaSelecionada ?? colheitasDaCultura[0]}
                saldoBruto={saldoBrutoColheita}
                saldosCarregados={saldosEstoqueCarregados}
              />
            </FieldWrapper>
            </div>
          ) : null}

          <FieldWrapper label="Quantidade de sacas vendidas">
            <input
              className={`${FIELD_INPUT}${inputQuantidadeInvalido ? " border-red-400 focus:border-red-500 focus:ring-red-500/25" : ""}`}
              type="number"
              inputMode="decimal"
              placeholder="Quantidade"
              min="0.01"
              step="0.01"
              max={saldoDisponivel != null && saldoDisponivel > 0 ? saldoDisponivel : undefined}
              value={form.quantidadeSacas}
              onChange={(e) => setForm((prev) => ({ ...prev, quantidadeSacas: e.target.value }))}
              onBlur={() => setQuantidadeTouched(true)}
              disabled={!form.colheitaId || saldoDisponivel == null || saldoDisponivel <= 0}
              aria-invalid={inputQuantidadeInvalido || undefined}
              aria-describedby={feedbackFormulario.exibirAlertaQuantidade ? "lucro-qtd-alerta" : undefined}
            />
            {feedbackFormulario.exibirAlertaQuantidade && feedbackFormulario.alertaQuantidade && (
              <div id="lucro-qtd-alerta">
                <CampoAlerta tipo={feedbackFormulario.alertaQuantidade.tipo}>
                  {feedbackFormulario.alertaQuantidade.mensagem}
                </CampoAlerta>
              </div>
            )}
            {!feedbackFormulario.exibirAlertaQuantidade && saldoDisponivel != null && saldoDisponivel > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Máximo: {formatSacas(saldoDisponivel)} sacas
                {colheitaSelecionada?.ano ? ` (colheita ${colheitaSelecionada.ano})` : ""}
              </p>
            )}
          </FieldWrapper>

          <FieldWrapper label="Valor unitário (R$)">
            <input
              className={FIELD_INPUT}
              type="number"
              inputMode="decimal"
              placeholder="Valor por saca"
              min="0.01"
              step="0.01"
              value={form.valorUnitario}
              onChange={(e) => setForm((prev) => ({ ...prev, valorUnitario: e.target.value }))}
            />
          </FieldWrapper>

          <FieldWrapper label="Comprador">
            <input
              className={FIELD_INPUT}
              type="text"
              placeholder="Nome do comprador"
              maxLength={150}
              value={form.comprador}
              onChange={(e) => setForm((prev) => ({ ...prev, comprador: e.target.value }))}
            />
          </FieldWrapper>

          <FieldWrapper label="Data da venda">
            <DatePickerInput
              value={form.data}
              onChange={(value) => setForm((prev) => ({ ...prev, data: value }))}
            />
          </FieldWrapper>
            </>
          ) : null}
        </div>

        <div className="agro-user-form-dialog__footer">
          <Button type="button" variant="danger" className="w-full sm:w-auto" onClick={onClose}>
            Cancelar
          </Button>
          <div
            className={`group relative w-full sm:w-auto${!isFormValid && !loading && feedbackFormulario.motivoSalvarDesabilitado ? " cursor-not-allowed" : ""}`}
            title={!isFormValid && !loading ? feedbackFormulario.motivoSalvarDesabilitado ?? undefined : undefined}
          >
            <span className="inline-flex w-full sm:w-auto">
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto"
                disabled={loading || bloqueioOperacional || !isFormValid}
              >
                {loading ? "Salvando..." : submitLabel}
              </Button>
            </span>
            {!isFormValid && !loading && feedbackFormulario.motivoSalvarDesabilitado && (
              <div
                role="tooltip"
                className="pointer-events-none invisible absolute bottom-full right-0 z-[60] mb-2 w-72 rounded-lg bg-slate-800 px-3 py-2.5 text-left text-xs leading-snug text-white shadow-lg group-hover:visible"
              >
                {feedbackFormulario.motivoSalvarDesabilitado}
              </div>
            )}
          </div>
        </div>
      </form>
    </AgroFormDialog>
  );
}
