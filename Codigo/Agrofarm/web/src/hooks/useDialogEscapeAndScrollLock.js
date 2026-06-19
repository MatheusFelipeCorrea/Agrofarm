import { useEffect } from "react";

/**
 * Fecha com Escape e bloqueia scroll do body enquanto o diálogo estiver aberto.
 * @param {boolean} isOpen
 * @param {() => void} onRequestClose
 */
export function useDialogEscapeAndScrollLock(isOpen, onRequestClose) {
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e) {
      if (e.key === "Escape") onRequestClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onRequestClose]);
}
