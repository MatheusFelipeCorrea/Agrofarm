import AgroFormDialog from "../dialogs/AgroFormDialog.jsx";
import Button from "../ui/Button/Button.jsx";
import { EyeIcon } from "../ui/icons.jsx";
import { HistoricoMapaDetalheBody } from "./HistoricoMapaDetalhe.jsx";

export default function FazendaHistoricoDetalheModal({ open, item, onClose }) {
  if (!item) return null;

  const titulo = item.safra ? `${item.nome} — ${item.safra}` : item.nome;

  return (
    <AgroFormDialog
      open={open}
      onClose={onClose}
      title={titulo}
      subtitle="Detalhes do talhão arquivado no histórico da fazenda."
      titleId="historico-detalhe-title"
      icon={EyeIcon}
    >
      <HistoricoMapaDetalheBody item={item} />
      <div className="agro-user-form-dialog__footer mt-6">
        <Button type="button" variant="primary" className="w-full sm:w-auto" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </AgroFormDialog>
  );
}
