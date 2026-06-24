import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import logoImage from "../../../assets/img/AgrofarmPreto.png";
import { notify } from "../../../lib/notify.js";
import { esqueciSenha, obterRecuperacaoConfig } from "../../../services/auth/auth.service.js";
import { getApiErrorMessage } from "../../../utils/apiError.js";
import { useAuthStore } from "../../../store/authStore.js";
import {
  Container,
  Overlay,
  Modal,
  InputGroup,
  LinkVoltar,
  SubmitButton,
  ErrorMessage,
} from "../auth.styles.jsx";

const emailSchema = z.object({
  email: z.string().email("Email inválido"),
});

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [emailConfigurado, setEmailConfigurado] = useState(true);

  const token = useAuthStore((s) => s.token);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    obterRecuperacaoConfig()
      .then((data) => setEmailConfigurado(Boolean(data?.emailConfigurado)))
      .catch(() => setEmailConfigurado(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    const parsed = emailSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? "Email inválido");
      return;
    }

    setIsPending(true);
    try {
      const resultado = await esqueciSenha({ email: parsed.data.email });

      if (!resultado.emailConfigurado) {
        notify.warning(
          "O envio de e-mail não está configurado neste ambiente. Peça a um administrador para redefinir sua senha em Gerenciar Usuários.",
          { id: "recuperar-senha-sem-email", duration: 9000 },
        );
        return;
      }

      notify.success("Se o email estiver cadastrado, você receberá o link em breve.", {
        id: "recuperar-senha-ok",
      });
    } catch (err) {
      notify.error(getApiErrorMessage(err, "Não foi possível enviar a solicitação."), { id: "recuperar-senha-erro" });
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
          <b>Esqueci minha senha</b>
        </h2>
        <p style={{ marginBottom: "1rem", color: "#555", fontSize: "0.95rem" }}>
          Informe seu email. Se existir cadastro, enviaremos o link para redefinir a senha.
        </p>

        {token ? (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Você está logado. Para recuperar por e-mail,{" "}
            <button type="button" className="font-semibold underline" onClick={() => clearSession()}>
              saia da conta
            </button>{" "}
            antes de continuar (opcional).
          </p>
        ) : null}

        {!emailConfigurado ? (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            O serviço de e-mail não está configurado. Peça a um administrador para redefinir sua senha pelo painel{" "}
            <strong>Gerenciar Usuários</strong>.
          </p>
        ) : null}

        <form onSubmit={handleSubmit}>
          <InputGroup>
            <label htmlFor="recuperar-email">Email</label>
            <input
              id="recuperar-email"
              type="email"
              autoComplete="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </InputGroup>

          {errorMsg ? <ErrorMessage>{errorMsg}</ErrorMessage> : null}

          <LinkVoltar as={Link} to="/login">
            ← Voltar ao login
          </LinkVoltar>

          <SubmitButton type="submit" disabled={isPending || !emailConfigurado}>
            {isPending ? "Enviando…" : "Requisitar nova senha"}
          </SubmitButton>
        </form>
      </Modal>
    </Container>
  );
}
