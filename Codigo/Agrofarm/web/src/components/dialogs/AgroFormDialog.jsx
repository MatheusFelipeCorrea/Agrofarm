import { X } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from "../ui/Modal/Modal.jsx";
import "../../styles/gerenciamento-usuarios.css";

export default function AgroFormDialog({ open, onClose, title, titleId = "agro-form-dialog-title", subtitle, icon: Icon, errorMessage, children }) {
  return (
    <Modal open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <ModalContent
        aria-labelledby={titleId}
        aria-describedby={subtitle ? `${titleId}-desc` : undefined}
        className="agro-user-form-dialog__surface overflow-x-hidden"
      >
        <div className="agro-user-form-dialog__body">
          <div className="agro-user-form-dialog__head">
            {Icon && (
              <div className="agro-user-form-dialog__head-icon">
                <Icon className="h-5 w-5" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <ModalTitle id={titleId} className="agro-user-form-dialog__title">
                {title}
              </ModalTitle>
              {subtitle && (
                <ModalDescription id={`${titleId}-desc`} className="agro-user-form-dialog__subtitle">
                  {subtitle}
                </ModalDescription>
              )}
            </div>

            <button type="button" onClick={onClose} className="agro-user-form-dialog__close" aria-label="Fechar modal">
              <X className="h-5 w-5" />
            </button>
          </div>

          <hr className="agro-user-form-dialog__rule" />

          {errorMessage ? (
            <p className="agro-user-form-dialog__alert" role="alert">
              {errorMessage}
            </p>
          ) : null}

          {children}
        </div>
      </ModalContent>
    </Modal>
  );
}
