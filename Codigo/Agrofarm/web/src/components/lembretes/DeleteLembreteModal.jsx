import AgroConfirmDialog from "../dialogs/AgroConfirmDialog.jsx";

export default function DeleteLembreteModal({ item, onClose, onConfirm, loading = false }) {
  if (!item) return null;

  return (
    <AgroConfirmDialog
      open={Boolean(item)}
      title="Excluir lembrete"
      message={`Deseja excluir o lembrete "${item.titulo}"?`}
      description="Essa ação não pode ser desfeita."
      titleId="excluir-lembrete-title"
      confirmLabel="Excluir"
      onClose={onClose}
      onConfirm={() => onConfirm(item.id)}
      loading={loading}
    />
  );
}