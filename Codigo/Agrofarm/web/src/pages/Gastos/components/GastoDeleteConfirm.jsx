import { AlertCircle } from "lucide-react";
import AgroConfirmDialog from "../../../components/dialogs/AgroConfirmDialog.jsx";
import { formatBRL } from "../../../utils/formatters.js";

export default function GastoDeleteConfirm({ open, gasto, onClose, onConfirm, loading }) {
  if (!open || !gasto) return null;

  const message = `Deseja excluir o gasto?`;
  const description = `O lançamento ${gasto.tipo} no valor de ${formatBRL(gasto.valor)} será removido. Esta ação não pode ser desfeita.`;

  return (
    <AgroConfirmDialog
      open={open}
      title="Excluir gasto"
      message={message}
      description={description}
      confirmLabel="Excluir"
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}


