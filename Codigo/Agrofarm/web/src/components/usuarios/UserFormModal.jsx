import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { UserCog, UserPlus, X } from "lucide-react";
import Button from "../ui/Button/Button.jsx";
import { ChevronDownIcon } from "../ui/icons.jsx";
import { useDialogEscapeAndScrollLock } from "../../hooks/useDialogEscapeAndScrollLock.js";
import { sanitizeDigits } from "../../utils/inputSanitize.js";
import TemporaryPasswordNotice from "./TemporaryPasswordNotice.jsx";

const emptyForm = () => ({
  nome: "",
  telefone: "",
  role: "",
  fazendaIds: [],
  email: "",
  resetPasswordToDefault: false,
});

function buildFormState(mode, initial) {
  if (mode === "edit" && initial) {
    return {
      nome: initial.nome ?? "",
      telefone: initial.telefone ?? "",
      role: initial.role ?? "",
      fazendaIds: Array.isArray(initial.fazendasVinculadas)
        ? initial.fazendasVinculadas.map((f) => f.id)
        : [],
      email: initial.email ?? "",
      resetPasswordToDefault: false,
    };
  }
  return emptyForm();
}

export default function UserFormModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
  loading,
  errorMessage,
  fazendasDisponiveis = [],
}) {
  const [form, setForm] = useState(() => buildFormState(mode, initial));
  const [fazendaSearch, setFazendaSearch] = useState("");
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [roleDropdownAberto, setRoleDropdownAberto] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(buildFormState(mode, initial));
    setFazendaSearch("");
    setDropdownAberto(false);
    setRoleDropdownAberto(false);
  }, [open, mode, initial]);
  const ROLES = [
    { value: "ADMIN", label: "Administrador" },
    { value: "FUNCIONARIO", label: "Funcionário" },
  ];
  const roleSelecionada = ROLES.find((r) => r.value === form.role);

  useDialogEscapeAndScrollLock(open, onClose);

  if (!open) return null;

  const isCreate = mode === "create";
  const title = isCreate ? "Criar Usuário" : "Editar Usuário";
  const subtitle = isCreate
    ? "O novo usuário receberá a senha temporária abaixo e deverá trocá-la no primeiro login."
    : "Atualize as informações do usuário selecionado.";
  const submitLabel = isCreate ? "Criar Usuário" : "Salvar alterações";
  const titleId = isCreate ? "criar-usuario-title" : "editar-usuario-title";
  const TitleIcon = isCreate ? UserPlus : UserCog;

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  const fazendasSelecionadas = fazendasDisponiveis.filter((f) => form.fazendaIds.includes(f.id));

  const fazendasSugeridas = fazendasDisponiveis.filter((f) => {
    if (form.fazendaIds.includes(f.id)) return false;
    const termo = fazendaSearch.trim().toLowerCase();
    if (!termo) return true;
    return f.nome?.toLowerCase().includes(termo);
  });

  function adicionarFazenda(fazendaId) {
    setForm((prev) => ({ ...prev, fazendaIds: [...new Set([...(prev.fazendaIds ?? []), fazendaId])] }));
    setFazendaSearch("");
  }

  function removerFazenda(fazendaId) {
    setForm((prev) => ({ ...prev, fazendaIds: (prev.fazendaIds ?? []).filter((id) => id !== fazendaId) }));
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[210] flex min-h-0 items-center justify-center p-4 sm:p-6 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" aria-hidden onClick={onClose} />
      <div
        className="usuario-form-modal agro-user-form-dialog__surface relative z-10 flex max-h-[min(92dvh,920px)] w-full flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="agro-user-form-dialog__body min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="agro-user-form-dialog__head">
              <div className="agro-user-form-dialog__head-icon">
                <TitleIcon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="agro-user-form-dialog__title">
                  {title}
                </h2>
                <p className="agro-user-form-dialog__subtitle">{subtitle}</p>
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

            <form onSubmit={handleSubmit} noValidate>
              <div className="agro-user-form-dialog__grid">
                <div className="agro-user-form-dialog__field md:col-span-1">
                  <label className="agro-user-form-dialog__label" htmlFor="usuario-form-nome">
                    Nome do usuário
                  </label>
                  <input
                    id="usuario-form-nome"
                    type="text"
                    autoComplete="name"
                    placeholder="Digite o nome do usuário"
                    value={form.nome}
                    onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value.slice(0, 100) }))}
                    className="usuario-form-modal-input agro-user-form-dialog__input"
                    maxLength={100}
                  />
                </div>

                <div className="agro-user-form-dialog__field md:col-span-1">
                  <label className="agro-user-form-dialog__label" htmlFor="usuario-form-telefone">
                    Telefone
                  </label>
                  <input
                    id="usuario-form-telefone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="(00) 9xxxx-xxxx"
                    value={form.telefone}
                    onChange={(e) => setForm((p) => ({ ...p, telefone: sanitizeDigits(e.target.value, 15) }))}
                    className="usuario-form-modal-input agro-user-form-dialog__input"
                    maxLength={15}
                    title="Apenas números (DDD + número)"
                  />
                </div>

                <div className="agro-user-form-dialog__field md:col-span-1">
                  <label className="agro-user-form-dialog__label" htmlFor="usuario-form-email">
                    E-mail
                  </label>
                  <input
                    id="usuario-form-email"
                    type="email"
                    autoComplete="email"
                    placeholder="exemplo@email.com"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="usuario-form-modal-input agro-user-form-dialog__input"
                  />
                </div>

                <div className="agro-user-form-dialog__field md:col-span-1">
                  <label className="agro-user-form-dialog__label" htmlFor="usuario-form-role-trigger">
                    Tipo de usuário
                  </label>
                  <div className="relative">
                    <button
                      id="usuario-form-role-trigger"
                      type="button"
                      className={`agro-user-form-dialog__select w-full text-left ${!form.role ? "agro-user-form-dialog__select--muted" : ""}`}
                      onClick={() => setRoleDropdownAberto((v) => !v)}
                    >
                      {roleSelecionada ? roleSelecionada.label : "Selecione o tipo de usuário"}
                    </button>
                    <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

                    {roleDropdownAberto ? (
                      <div className="fixed inset-0 z-10" aria-hidden onClick={() => setRoleDropdownAberto(false)} />
                    ) : null}
                    {roleDropdownAberto ? (
                      <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                        {ROLES.map((opcao) => (
                          <button
                            key={opcao.value}
                            type="button"
                            className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-gray-100 ${
                              form.role === opcao.value ? "font-medium text-[var(--agro-brand)]" : "text-gray-700"
                            }`}
                            onClick={() => {
                              setForm((p) => ({ ...p, role: opcao.value }));
                              setRoleDropdownAberto(false);
                            }}
                          >
                            {opcao.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {isCreate ? (
                  <div className="agro-user-form-dialog__field md:col-span-2">
                    <p className="agro-user-form-dialog__label">Acesso inicial</p>
                    <TemporaryPasswordNotice />
                  </div>
                ) : (
                  <div className="agro-user-form-dialog__field md:col-span-2">
                    <label className="agro-user-form-dialog__label flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--agro-brand)] focus:ring-[var(--agro-brand)]"
                        checked={Boolean(form.resetPasswordToDefault)}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, resetPasswordToDefault: e.target.checked }))
                        }
                      />
                      <span>
                        <span className="block font-medium text-slate-800">
                          Redefinir senha para o padrão temporário
                        </span>
                        <span className="mt-1 block text-sm font-normal text-slate-500">
                          O usuário receberá a senha temporária e deverá alterá-la no primeiro login.
                        </span>
                      </span>
                    </label>
                    {form.resetPasswordToDefault ? <TemporaryPasswordNotice className="mt-3" /> : null}
                  </div>
                )}

                <div className="agro-user-form-dialog__field md:col-span-2">
                  <div className="agro-user-form-dialog__label-row">
                    <label className="agro-user-form-dialog__label mb-0">Fazenda vinculada</label>
                    <span className="agro-user-form-dialog__hint-pill">Obrigatório para funcionários.</span>
                  </div>
                  <p className="agro-user-form-dialog__helper">Administradores podem acessar todas as fazendas.</p>

                  <div className="relative">
                    <button
                      type="button"
                      className="agro-user-form-dialog__select w-full text-left"
                      onClick={() => setDropdownAberto((v) => !v)}
                    >
                      {form.fazendaIds.length > 0
                        ? `${form.fazendaIds.length} fazenda${form.fazendaIds.length > 1 ? "s" : ""} selecionada${form.fazendaIds.length > 1 ? "s" : ""}`
                        : <span className="agro-user-form-dialog__select--muted">Selecione uma fazenda</span>}
                    </button>
                    <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

                    {dropdownAberto ? (
                      <div className="fixed inset-0 z-[240]" aria-hidden onClick={() => setDropdownAberto(false)} />
                    ) : null}
                    {dropdownAberto ? (
                      <div className="absolute z-[260] mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
                        <div className="border-b border-gray-100 p-2">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Buscar fazenda por nome"
                            value={fazendaSearch}
                            onChange={(e) => setFazendaSearch(e.target.value)}
                            className="usuario-form-modal-input agro-user-form-dialog__input"
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto p-2">
                          {fazendasSugeridas.length > 0 ? (
                            <ul className="space-y-1">
                              {fazendasSugeridas.map((fazenda) => (
                                <li key={fazenda.id}>
                                  <button
                                    type="button"
                                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                                    onClick={() => adicionarFazenda(fazenda.id)}
                                  >
                                    {fazenda.nome}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="px-2 py-1 text-sm text-gray-500">Nenhuma fazenda encontrada.</p>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {fazendasSelecionadas.map((fazenda) => (
                      <span
                        key={fazenda.id}
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--agro-brand)]/10 px-3 py-1 text-sm font-medium text-[var(--agro-brand)]"
                      >
                        {fazenda.nome}
                        <button
                          type="button"
                          className="rounded-full px-1 text-[var(--agro-brand)] hover:bg-[var(--agro-brand)]/15"
                          aria-label={`Remover ${fazenda.nome}`}
                          onClick={() => removerFazenda(fazenda.id)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {form.role === "FUNCIONARIO" && form.fazendaIds.length < 1 ? (
                    <p className="mt-2 text-sm text-red-600">Selecione ao menos 1 fazenda para funcionário.</p>
                  ) : null}
                </div>
              </div>

              <div className="agro-user-form-dialog__footer">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primaryBrand"
                  className="w-full sm:w-auto"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? "Salvando..." : submitLabel}
                </Button>
              </div>
            </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
