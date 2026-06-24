import { useState } from "react";
import { z } from "zod";
import MainLayout from "../../../layouts/MainLayout.jsx";
import Button from "../../../components/ui/Button/Button.jsx";
import { useChangePassword } from "../../../queries/auth/useAuthQueries.js";
import { getApiErrorMessage } from "../../../utils/apiError.js";
import { DEFAULT_ADMIN_RESET_PASSWORD } from "../../../constants/passwordDefaults.js";

const MIN_SENHA = 8;

const alterarSenhaSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual"),
    newPassword: z.string().min(MIN_SENHA, `A nova senha deve ter no mínimo ${MIN_SENHA} caracteres`),
    confirmNewPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "As senhas não coincidem",
    path: ["confirmNewPassword"],
  })
  .refine((d) => d.newPassword !== DEFAULT_ADMIN_RESET_PASSWORD, {
    message: "A nova senha não pode ser igual à senha temporária padrão",
    path: ["newPassword"],
  });

export default function AlterarSenha() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { mutate: alterarSenha, isPending, isSuccess } = useChangePassword();

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    const parsed = alterarSenhaSchema.safeParse({ currentPassword, newPassword, confirmNewPassword });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    alterarSenha(parsed.data, {
      onSuccess: () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      },
      onError: (error) => {
        setErrorMsg(getApiErrorMessage(error, "Não foi possível alterar a senha."));
      },
    });
  }

  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-lg pt-8">
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Alterar senha</h1>
          <p className="text-sm text-gray-500">
            Defina uma nova senha para sua conta. Você permanecerá conectado após a alteração.
          </p>
        </header>

        {isSuccess ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Senha alterada com sucesso.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="senha-atual" className="mb-1 block text-sm font-medium text-gray-700">
              Senha atual
            </label>
            <input
              id="senha-atual"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--agro-brand)] focus:ring-2 focus:ring-[var(--agro-brand)]/20"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="nova-senha-conta" className="mb-1 block text-sm font-medium text-gray-700">
              Nova senha
            </label>
            <input
              id="nova-senha-conta"
              type="password"
              autoComplete="new-password"
              placeholder={`Mínimo ${MIN_SENHA} caracteres`}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--agro-brand)] focus:ring-2 focus:ring-[var(--agro-brand)]/20"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="confirmar-nova-senha-conta" className="mb-1 block text-sm font-medium text-gray-700">
              Confirmar nova senha
            </label>
            <input
              id="confirmar-nova-senha-conta"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--agro-brand)] focus:ring-2 focus:ring-[var(--agro-brand)]/20"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </div>

          {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}

          <Button type="submit" variant="primaryBrand" className="w-full" disabled={isPending} aria-busy={isPending}>
            {isPending ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
}
