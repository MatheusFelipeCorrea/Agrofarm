import AgroConfirmDialog from "../../../components/dialogs/AgroConfirmDialog.jsx";
import { formatDate } from "../../../utils/formatters.js";

export default function ColheitaDeleteConfirm({ open, colheita, onClose, onConfirm, loading }) {
  if (!open || !colheita) return null;

  return (
    <AgroConfirmDialog
      open={open}
      title="Excluir colheita"
      message={`Deseja excluir a colheita de ${colheita.cultura?.nome ?? "-"} do dia ${formatDate(colheita.dataColheita)}?`}
      description="Esta acao nao pode ser desfeita."
      confirmLabel="Excluir"
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

