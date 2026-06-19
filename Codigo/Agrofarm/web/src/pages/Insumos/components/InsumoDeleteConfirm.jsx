import { useEffect } from "react";
import { createPortal } from "react-dom";
import { formatBRL } from "../../../utils/formatters.js";

export default function InsumoDeleteConfirm({ open, registro, onClose, onConfirm, loading }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !registro) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-0 items-center justify-center p-6" role="dialog" aria-modal="true">
      <div role="presentation" aria-hidden className="absolute inset-0 cursor-pointer bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-900">Excluir consumo?</h2>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          O registro de <span className="font-medium text-gray-900">{registro.item}</span> no valor total de{" "}
          <span className="font-medium tabular-nums text-gray-900">{formatBRL(registro.valorTotal)}</span> será removido.
          Esta ação não pode ser desfeita.
        </p>
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="h-10 rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="h-10 rounded-lg bg-red-500 px-5 text-sm font-medium text-white hover:bg-red-600"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Excluindo…" : "Excluir"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
