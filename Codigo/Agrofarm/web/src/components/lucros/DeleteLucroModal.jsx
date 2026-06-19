import AgroConfirmDialog from "../dialogs/AgroConfirmDialog.jsx";
import { formatBRL } from "../../utils/formatters.js";

export default function DeleteLucroModal({ open, lucro, loading, onClose, onConfirm }) {
  if (!open || !lucro) return null;

  return (
    <AgroConfirmDialog
      open={open}
      title="Excluir lucro"
      message="Deseja excluir este lucro?"
      description={`Esta ação não pode ser desfeita e o registro de ${lucro.cultura?.nome ?? lucro.culturaNome ?? "?"} com ${lucro.quantidadeSacas ?? "?"} sacas no valor de ${formatBRL(lucro.valorUnitario * lucro.quantidadeSacas || 0)} será removido.`}
      confirmLabel="Excluir"
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
