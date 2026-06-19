import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import Button from "../ui/Button/Button.jsx";
import { useDialogEscapeAndScrollLock } from "../../hooks/useDialogEscapeAndScrollLock.js";

export default function DeleteUserModal({ open, nomeUsuario, errorMessage, onClose, onConfirm, loading }) {
  useDialogEscapeAndScrollLock(open, onClose);

  if (!open) return null;

  const label = nomeUsuario?.trim() || "este usuário";

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex min-h-0 items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="excluir-usuario-title"
    >
      <div
        role="presentation"
        className="absolute inset-0 cursor-pointer bg-black/30 backdrop-blur-[1px]"
        aria-hidden
        onClick={onClose}
      />

      <div className="agro-delete-user-dialog__surface relative z-10 mx-3 w-full max-w-[25.5rem] sm:mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="agro-delete-user-dialog__header">
          <div className="agro-delete-user-dialog__icon-wrap">
            <AlertTriangle className="h-5 w-5 text-[#c64848]" />
          </div>
          <h2 id="excluir-usuario-title" className="agro-delete-user-dialog__headline">Excluir usuário</h2>
          <button type="button" className="agro-delete-user-dialog__close" onClick={onClose} aria-label="Fechar modal">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="agro-delete-user-dialog__content">
          <p className="agro-delete-user-dialog__title">Deseja excluir o usuário {label}?</p>
          <p className="agro-delete-user-dialog__description">
            Esta ação não pode ser desfeita e o usuário perderá o acesso à plataforma.
          </p>

          {errorMessage ? (
            <p className="mt-3 w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="agro-delete-user-dialog__actions">
          <Button type="button" variant="outline" className="min-h-10 min-w-[8.5rem]" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" className="min-h-10 min-w-[8.5rem]" disabled={loading} onClick={onConfirm}>
            {loading ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
