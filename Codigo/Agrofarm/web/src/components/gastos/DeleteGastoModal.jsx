import AgroConfirmDialog from "../dialogs/AgroConfirmDialog.jsx";
import { formatBRL } from "../../utils/formatters.js";

export default function DeleteGastoModal({ open, gasto, loading, onClose, onConfirm }) {
  if (!open || !gasto) return null;

  return (
    <AgroConfirmDialog
      open={open}
      title="Excluir gasto"
      message="Deseja excluir este gasto?"
      description={`Esta acao nao pode ser desfeita e o registro ${gasto.tipo} no valor de ${formatBRL(gasto.valor)} sera removido.`}
      confirmLabel="Excluir"
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
