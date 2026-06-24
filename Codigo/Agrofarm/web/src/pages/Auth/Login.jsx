import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLogin } from "../../queries/auth/useAuthQueries.js";
import { useAuthStore } from "../../store/authStore.js";
import { PasswordChangeRequiredError } from "../../services/auth/auth.service.js";
import ChangeInitialPasswordModal from "../../components/auth/ChangeInitialPasswordModal.jsx";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { loginSchema } from "../../utils/validators.js";
import { getFirstAllowedPath } from "../../routes/routeAccess.js";
import { DEFAULT_ADMIN_RESET_PASSWORD } from "../../constants/passwordDefaults.js";
import logoImage from "../../assets/img/Agrofarm.png";
import logoWhiteImage from "../../assets/img/AgroFarmBranca.png";
import {
  Container,
  Overlay,
  Modal,
  InputGroup,
  ErrorMessage,
  EsqueciSenhaLink,
  SubmitButton,
} from "./auth.styles.jsx";

function FeatureIcon({ children }) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/90 ring-1 ring-white/10">
      {children}
    </span>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [passwordChange, setPasswordChange] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const [mostrarSenhaRedefinida] = useState(() => Boolean(location.state?.senhaRedefinida));
  const [mostrarSenhaResetAdmin] = useState(() => Boolean(location.state?.senhaResetadaAdmin));
  const token = useAuthStore((s) => s.token);
  const menu = useAuthStore((s) => s.menu);
  const setSession = useAuthStore((s) => s.setSession);
  const { mutate: loginUser, isPending } = useLogin();

  useEffect(() => {
    if (token) {
      navigate(getFirstAllowedPath(menu), { replace: true });
    }
  }, [token, menu, navigate]);

  useEffect(() => {
    if (!location.state?.senhaRedefinida && !location.state?.senhaResetadaAdmin) return;
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  function handleSubmit(e) {
    e.preventDefault();

    const result = loginSchema.safeParse({ email, senha });

    if (!result.success) {
      setErrorMsg(result.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    loginUser(
      { email, senha },
      {
        onSuccess: (data) => {
          try {
            localStorage.removeItem("token");
          } catch {
            // Ignorar erros de localStorage
          }
          setSession(data);
          navigate(getFirstAllowedPath(data.menu), { replace: true });
        },
        onError: (error) => {
          if (
            error instanceof PasswordChangeRequiredError ||
            error?.name === "PasswordChangeRequiredError"
          ) {
            setPasswordChange({ userId: error.userId, initialPassword: senha });
            setErrorMsg("");
            return;
          }
          setErrorMsg(getApiErrorMessage(error, "Não foi possível entrar. Verifique email e senha."));
        },
      },
    );
  }

  function handlePasswordChangeSuccess(data) {
    try {
      localStorage.removeItem("token");
    } catch {
      // Ignorar erros de localStorage
    }
    setPasswordChange(null);
    setSession(data);
    navigate(getFirstAllowedPath(data.menu), { replace: true });
  }

  return (
    <Container>
      <Overlay />
      <div className="relative z-[2] mx-auto flex w-[min(1120px,94vw)] items-center justify-center">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1.2fr_0.9fr] lg:gap-14">
          {/* Branding (esquerda) */}
          <section className="hidden lg:block">
            <div className="max-w-xl">
              <div className="flex items-center gap-3">
                <img src={logoWhiteImage} alt="AgroFarm" className="h-12 w-auto" />
              </div>

              <p className="mt-5 text-[20px] font-semibold leading-snug text-white/95">
                Gestão inteligente para
                <br />
                fazendas de <span className="text-emerald-300">alta performance</span>
              </p>

              <div className="mt-8 grid grid-cols-4 gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <FeatureIcon>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19V5" />
                      <path d="M8 19V9" />
                      <path d="M12 19V12" />
                      <path d="M16 19V7" />
                      <path d="M20 19V10" />
                    </svg>
                  </FeatureIcon>
                  <span className="text-[12px] font-medium text-white/80">Mais controle</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <FeatureIcon>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </FeatureIcon>
                  <span className="text-[12px] font-medium text-white/80">Mais segurança</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <FeatureIcon>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1v22" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </FeatureIcon>
                  <span className="text-[12px] font-medium text-white/80">Mais lucro</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <FeatureIcon>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19h16" />
                      <path d="M4 15h16" />
                      <path d="M7 15V5h10v10" />
                    </svg>
                  </FeatureIcon>
                  <span className="text-[12px] font-medium text-white/80">Mais produtividade</span>
                </div>
              </div>
            </div>
          </section>

          {/* Card (direita) */}
          <section className="flex w-full justify-center lg:justify-end">
            <div className="flex w-full max-w-[600px] flex-col items-center">
              <Modal>
                <div className="flex flex-col items-center">
                  <div className="mb-2 flex h-[92px] w-[92px] items-center justify-center">
                    <img src={logoImage} className="logo" alt="Logo AgroFarm" />
                  </div>
                  <h2 className="text-center font-extrabold text-slate-900">Bem-vindo de volta!</h2>
                  <p className="mt-1 text-center text-[13px] text-slate-500">Faça login para acessar sua conta</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6">
                  <InputGroup>
                    <label htmlFor="login-email">E-mail</label>
                    <div className="relative w-full">
                      <span className="pointer-events-none absolute top-1/2 -translate-y-[3%] left-3 flex items-center text-slate-400">
                        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16v16H4z" opacity=".05" />
                          <path d="M4 8l8 5 8-5" />
                          <path d="M4 6h16v12H4z" />
                        </svg>
                      </span>
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="seu@email.com"
                        className="input-with-left-icon"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </InputGroup>

                  <InputGroup>
                    <label htmlFor="login-senha">Senha</label>
                    <div className="relative w-full">
                      <span className="pointer-events-none absolute top-1/2 -translate-y-[5%] left-3 flex items-center text-slate-400">
                        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M7 11V8a5 5 0 0 1 10 0v3" />
                          <path d="M6 11h12v10H6z" />
                        </svg>
                      </span>
                      <input
                        id="login-senha"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Sua senha"
                        className="input-with-left-icon"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                      />
                    </div>

                    {errorMsg ? <ErrorMessage>{errorMsg}</ErrorMessage> : null}
                  </InputGroup>

                  {mostrarSenhaRedefinida ? (
                    <p className="mb-3 text-[13px] font-medium text-emerald-700">
                      Senha redefinida com sucesso. Entre com a nova senha.
                    </p>
                  ) : null}

                  {mostrarSenhaResetAdmin ? (
                    <p className="mb-3 text-[13px] font-medium text-amber-800">
                      Sua senha foi redefinida. Entre com a senha temporária{" "}
                      <span className="font-mono">{DEFAULT_ADMIN_RESET_PASSWORD}</span> e defina uma nova senha.
                    </p>
                  ) : null}

                  <EsqueciSenhaLink as={Link} to="/recuperar-senha">
                    Esqueci minha senha
                  </EsqueciSenhaLink>

                  <SubmitButton type="submit" disabled={isPending}>
                    {isPending ? "Entrando..." : "Entrar"}
                  </SubmitButton>
                </form>
              </Modal>

              <p className="mt-6 flex max-w-[36rem] items-center justify-center gap-2 text-center text-[12px] font-medium text-white/80">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                Seus dados estão protegidos com segurança de ponta a ponta
              </p>
            </div>
          </section>
        </div>
      </div>

      <ChangeInitialPasswordModal
        open={Boolean(passwordChange)}
        userId={passwordChange?.userId ?? ""}
        initialPassword={passwordChange?.initialPassword ?? ""}
        onSuccess={handlePasswordChangeSuccess}
        onClose={() => setPasswordChange(null)}
      />
    </Container>
  );
}
