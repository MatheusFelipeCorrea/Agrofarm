import AgroConfirmDialog from "../../components/dialogs/AgroConfirmDialog.jsx";

export default function MapPolygonDeleteConfirm({ open, poligono, loading, onClose, onConfirm }) {
  if (!open || !poligono) return null;

  return (
    <AgroConfirmDialog
      open={open}
      title="Excluir área"
      message={`Deseja excluir a área "${poligono.nome}"?`}
      description="O talhão sai do mapa e vai para o Histórico da fazenda. O status (Colhida, Encerrada ou Arquivada) depende de cultura e colheitas registradas."
      confirmLabel="Excluir"
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
