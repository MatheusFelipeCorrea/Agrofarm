import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { z } from "zod";
import { X } from "lucide-react";
import { useChangeInitialPassword } from "../../queries/auth/useAuthQueries.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import Button from "../ui/Button/Button.jsx";

const MIN_SENHA = 8;

const trocarSenhaSchema = z
  .object({
    oldPassword: z.string().min(1, "Informe a senha que você usou para entrar"),
    newPassword: z.string().min(MIN_SENHA, `A nova senha deve ter no mínimo ${MIN_SENHA} caracteres`),
    confirmNewPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "As senhas não coincidem",
    path: ["confirmNewPassword"],
  });

export default function ChangeInitialPasswordModal({
  open,
  userId,
  initialPassword = "",
  onSuccess,
  onClose,
}) {
  const [oldPassword, setOldPassword] = useState(initialPassword);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { mutate: trocarSenha, isPending } = useChangeInitialPassword();

  useEffect(() => {
    if (!open) return;
    setOldPassword(initialPassword);
    setNewPassword("");
    setConfirmNewPassword("");
    setErrorMsg("");
  }, [open, initialPassword, userId]);

  if (!open || !userId) return null;

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    const parsed = trocarSenhaSchema.safeParse({ oldPassword, newPassword, confirmNewPassword });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    trocarSenha(
      {
        userId,
        oldPassword: parsed.data.oldPassword,
        newPassword: parsed.data.newPassword,
        confirmNewPassword: parsed.data.confirmNewPassword,
      },
      {
        onSuccess: (data) => onSuccess(data),
        onError: (error) => {
          setErrorMsg(getApiErrorMessage(error, "Não foi possível alterar a senha."));
        },
      },
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trocar-senha-inicial-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" aria-hidden onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="trocar-senha-inicial-title" className="text-lg font-bold text-slate-900">
              Defina sua nova senha
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Por segurança, troque a senha antes de acessar o sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="modal-senha-atual" className="mb-1 block text-sm font-medium text-slate-700">
              Senha atual (a que você usou para entrar)
            </label>
            <input
              id="modal-senha-atual"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--agro-brand)] focus:ring-2 focus:ring-[var(--agro-brand)]/20"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="modal-nova-senha" className="mb-1 block text-sm font-medium text-slate-700">
              Nova senha
            </label>
            <input
              id="modal-nova-senha"
              type="password"
              autoComplete="new-password"
              placeholder={`Mínimo ${MIN_SENHA} caracteres`}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--agro-brand)] focus:ring-2 focus:ring-[var(--agro-brand)]/20"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="modal-confirmar-senha" className="mb-1 block text-sm font-medium text-slate-700">
              Confirmar nova senha
            </label>
            <input
              id="modal-confirmar-senha"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--agro-brand)] focus:ring-2 focus:ring-[var(--agro-brand)]/20"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </div>

          {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}

          <Button type="submit" variant="primaryBrand" className="w-full" disabled={isPending} aria-busy={isPending}>
            {isPending ? "Salvando..." : "Salvar e continuar"}
          </Button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
