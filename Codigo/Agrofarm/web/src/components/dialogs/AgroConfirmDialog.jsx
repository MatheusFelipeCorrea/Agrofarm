import { AlertCircle, X } from "lucide-react";
import Button from "../ui/Button/Button.jsx";
import { Modal, ModalContent, ModalDescription, ModalTitle } from "../ui/Modal/Modal.jsx";
import "../../styles/gerenciamento-usuarios.css";

export default function AgroConfirmDialog({
  open,
  title,
  message,
  description,
  titleId = "agro-confirm-dialog-title",
  confirmLabel = "Excluir",
  onClose,
  onConfirm,
  loading,
  errorMessage,
}) {
  if (!open) return null;

  return (
    <Modal open={open} onOpenChange={(next) => (!next ? onClose() : null)}>
      <ModalContent 
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-desc`}
        className="agro-delete-user-dialog__surface"
      >
        <div className="agro-delete-user-dialog__header">
          <div className="agro-delete-user-dialog__icon-wrap">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <ModalTitle id={titleId} className="agro-delete-user-dialog__headline">
            {title}
          </ModalTitle>
          <button type="button" onClick={onClose} className="agro-delete-user-dialog__close" aria-label="Fechar modal">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="agro-delete-user-dialog__content">
          <ModalDescription id={`${titleId}-desc`} className="agro-delete-user-dialog__title">
            {message}
          </ModalDescription>
          {description && (
            <p className="agro-delete-user-dialog__description">{description}</p>
          )}
        </div>

        <hr className="agro-delete-user-dialog__divider" />

        <div className="agro-delete-user-dialog__actions">
          {errorMessage ? (
            <p
              className="w-full basis-full rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}
          <Button type="button" variant="danger" className="min-h-10 min-w-[8.75rem] px-6" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" className="min-h-10 min-w-[8.75rem] px-6" disabled={loading} onClick={onConfirm}>
            {loading ? "Aguarde…" : confirmLabel}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
