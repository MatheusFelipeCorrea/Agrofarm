import AgroFormDialog from "../../../components/dialogs/AgroFormDialog.jsx";
import Button from "../../../components/ui/Button/Button.jsx";
import { EyeIcon } from "../../../components/ui/icons.jsx";
import { formatBRL, formatarData } from "../../../utils/formatters.js";

function DetalheCampo({ label, valor, className = "" }) {
  return (
    <div className={`agro-user-form-dialog__field ${className}`.trim()}>
      <span className="agro-user-form-dialog__label">{label}</span>
      <p className="mt-1 text-sm font-semibold text-gray-900">{valor || "—"}</p>
    </div>
  );
}

export default function DashboardExtratoDetalheModal({ open, onClose, movimento }) {
  if (!movimento) return null;

  const isLucro = movimento.tipo === "LUCRO";
  const valorFormatado = `${isLucro ? "+" : "-"} ${formatBRL(movimento.valor)}`;
  const titulo = movimento.titulo || movimento.descricao || "Movimentação";

  return (
    <AgroFormDialog
      open={open}
      onClose={onClose}
      title={titulo}
      subtitle="Detalhes da movimentação financeira"
      titleId="extrato-detalhe-title"
      icon={EyeIcon}
    >
      <div
        className={`mb-4 rounded-xl border px-4 py-3 ${
          isLucro ? "border-emerald-200 bg-emerald-50/80" : "border-red-200 bg-red-50/80"
        }`}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Valor</p>
        <p className={`mt-1 text-2xl font-bold tabular-nums ${isLucro ? "text-emerald-700" : "text-red-600"}`}>
          {valorFormatado}
        </p>
      </div>

      <div className="agro-user-form-dialog__grid">
        <DetalheCampo label="Tipo" valor={isLucro ? "Entrada (receita)" : "Saída (despesa)"} />
        <DetalheCampo label="Categoria" valor={movimento.categoria} />
        <DetalheCampo label="Fazenda" valor={movimento.fazendaNome} />
        <DetalheCampo label="Data e hora" valor={formatarData(movimento.criadoEm || movimento.data)} />
        <DetalheCampo label="Forma de pagamento" valor={movimento.formaPagamento} />
        <DetalheCampo label="Documento" valor={movimento.documento} />
        {isLucro ? <DetalheCampo label="Comprador" valor={movimento.comprador} /> : null}
        {!isLucro && movimento.culturaNome ? (
          <DetalheCampo label="Cultura" valor={movimento.culturaNome} />
        ) : null}
        <DetalheCampo
          label="Observação"
          valor={movimento.observacao || movimento.descricao}
          className="md:col-span-2"
        />
      </div>

      <div className="agro-user-form-dialog__footer mt-6">
        <Button type="button" variant="primary" className="w-full sm:ml-auto sm:w-auto" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </AgroFormDialog>
  );
}
