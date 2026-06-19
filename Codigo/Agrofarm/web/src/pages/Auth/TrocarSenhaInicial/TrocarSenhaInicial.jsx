import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import logoImage from "../../../assets/img/AgrofarmPreto.png";
import { useChangeInitialPassword } from "../../../queries/auth/useAuthQueries.js";
import { useAuthStore } from "../../../store/authStore.js";
import { getFirstAllowedPath } from "../../../routes/routeAccess.js";
import { getApiErrorMessage } from "../../../utils/apiError.js";
import { DEFAULT_ADMIN_RESET_PASSWORD } from "../../../constants/passwordDefaults.js";
import {
  Container,
  Overlay,
  Modal,
  InputGroup,
  LinkVoltar,
  SubmitButton,
  ErrorMessage,
} from "../auth.styles.jsx";

const MIN_SENHA = 8;

const trocarSenhaSchema = z
  .object({
    oldPassword: z.string().min(1, "Informe a senha temporária"),
    newPassword: z.string().min(MIN_SENHA, `A nova senha deve ter no mínimo ${MIN_SENHA} caracteres`),
    confirmNewPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "As senhas não coincidem",
    path: ["confirmNewPassword"],
  });

export default function TrocarSenhaInicial() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId ?? "";
  const initialPassword = location.state?.initialPassword || DEFAULT_ADMIN_RESET_PASSWORD;

  const [oldPassword, setOldPassword] = useState(initialPassword);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const setSession = useAuthStore((s) => s.setSession);
  const { mutate: trocarSenha, isPending } = useChangeInitialPassword();

  useEffect(() => {
    if (!userId) {
      navigate("/login", { replace: true });
    }
  }, [userId, navigate]);

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
        onSuccess: (data) => {
          setSession(data);
          navigate(getFirstAllowedPath(data.menu), { replace: true });
        },
        onError: (error) => {
          setErrorMsg(getApiErrorMessage(error, "Não foi possível alterar a senha."));
        },
      },
    );
  }

  if (!userId) return null;

  return (
    <Container>
      <Overlay />
      <Modal>
        <img src={logoImage} className="logo" alt="Logo AgroFarm" />
        <h2>
          <b>Defina sua nova senha</b>
        </h2>
        <p className="mt-2 text-center text-[13px] text-slate-500">
          Por segurança, troque a senha temporária antes de acessar o sistema.
        </p>

        <form onSubmit={handleSubmit} className="mt-4">
          <InputGroup>
            <label htmlFor="senha-temporaria">Senha temporária</label>
            <input
              id="senha-temporaria"
              type="password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </InputGroup>

          <InputGroup>
            <label htmlFor="nova-senha-inicial">Nova senha</label>
            <input
              id="nova-senha-inicial"
              type="password"
              autoComplete="new-password"
              placeholder={`Mínimo ${MIN_SENHA} caracteres`}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </InputGroup>

          <InputGroup>
            <label htmlFor="confirmar-nova-senha-inicial">Confirmar nova senha</label>
            <input
              id="confirmar-nova-senha-inicial"
              type="password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
            {errorMsg ? <ErrorMessage>{errorMsg}</ErrorMessage> : null}
          </InputGroup>

          <SubmitButton type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar e entrar"}
          </SubmitButton>
        </form>

        <LinkVoltar as={Link} to="/login">
          ← Voltar ao login
        </LinkVoltar>
      </Modal>
    </Container>
  );
}
