import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import logoImage from "../../../assets/img/AgrofarmPreto.png";
import { notify } from "../../../lib/notify.js";
import { redefinirSenha } from "../../../services/auth/auth.service.js";
import { getApiErrorMessage } from "../../../utils/apiError.js";
import {
  Container,
  Overlay,
  Modal,
  InputGroup,
  LinkVoltar,
  SubmitButton,
  ErrorMessage,
} from "../auth.styles.jsx";

const senhaSchema = z
  .object({
    senha: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
    confirmSenha: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.senha === d.confirmSenha, {
    message: "As senhas não coincidem",
    path: ["confirmSenha"],
  });

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!tokenFromUrl) {
      setErrorMsg("Link inválido ou incompleto. Solicite uma nova redefinição de senha.");
      return;
    }

    const parsed = senhaSchema.safeParse({ senha, confirmSenha });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setIsPending(true);
    try {
      await redefinirSenha({ token: tokenFromUrl, novaSenha: parsed.data.senha });
      navigate("/login", { replace: true, state: { senhaRedefinida: true } });
    } catch (err) {
      notify.error(getApiErrorMessage(err, "Não foi possível redefinir a senha. O link pode ter expirado."), {
        id: "redefinir-senha-erro",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Container>
      <Overlay />
      <Modal>
        <img src={logoImage} className="logo" alt="Logo AgroFarm" />
        <h2>
          <b>Redefinir minha senha</b>
        </h2>
        <form onSubmit={handleSubmit}>
          <InputGroup>
            <label htmlFor="nova-senha">Nova senha</label>
            <input
              id="nova-senha"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </InputGroup>

          <InputGroup>
            <label htmlFor="confirmar-senha">Confirmar senha</label>
            <input
              id="confirmar-senha"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              value={confirmSenha}
              onChange={(e) => setConfirmSenha(e.target.value)}
            />
          </InputGroup>

          {errorMsg ? <ErrorMessage>{errorMsg}</ErrorMessage> : null}

          <LinkVoltar as={Link} to="/login">
            ← Voltar ao login
          </LinkVoltar>

          <SubmitButton type="submit" disabled={isPending || !tokenFromUrl}>
            {isPending ? "Salvando…" : "Redefinir senha"}
          </SubmitButton>
        </form>
      </Modal>
    </Container>
  );
}
