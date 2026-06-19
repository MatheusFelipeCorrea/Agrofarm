import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logoBranca from "../../../assets/img/AgroFarmBranca.png";
import { logout } from "../../../services/auth/auth.service.js";
import { useAuthStore } from "../../../store/authStore.js";
import { useFazendaListQuery } from "../../../queries/fazenda/useFazendaQueries.js";
import SidebarNavItem from "../Sidebar/SidebarNavItem.jsx";
import { ICON_MAP } from "../Sidebar/sidebarIconMap.js";
import { ensureMenuComplete } from "../../../lib/ensureMenuComplete.js";
import { getDefaultExpandedGroupIds } from "../Sidebar/sidebarNav.utils.js";
import { ChevronDownIcon } from "../../ui/icons.jsx";
import { buildFazendaOptions, getFazendaSelecionadaLabel } from "./headerFazenda.utils.js";
import {
  useMarcarNotificacaoComoLidaMutation,
  useMarcarTodasNotificacoesComoLidasMutation,
  useNotificacoesQuery,
} from "../../../queries/notificacao/useNotificacaoQueries.js";
import SoftBadge from "../../ui/SoftBadge/SoftBadge.jsx";
import { getNotificacaoCardClass, NotificacaoTipoBadge } from "../../ui/badges/DomainBadges.jsx";

function IconMenu() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M15 17H5l2-2v-4a5 5 0 0110 0v4l2 2h-4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M9.5 19a2.5 2.5 0 005 0" />
    </svg>
  );
}

function IconUserOutline() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0114 0" />
    </svg>
  );
}

function IconEye(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden {...props}>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatarDataNotificacao(valor) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Agora";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function UserAvatar() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#114437] text-white">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-[18px] w-[18px]" aria-hidden>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20a8 8 0 0116 0" />
      </svg>
    </div>
  );
}

export default function Header({ onToggleSidebar, hideHeaderInput = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [fazendaDropdownAberto, setFazendaDropdownAberto] = useState(false);
  const [notificacaoDropdownAberto, setNotificacaoDropdownAberto] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const headerExcludedPrefixes = useMemo(
    () => ["/usuarios", "/fazendas", "/gastos", "/lucros", "/estoque", "/chatbot", "/insights-inteligentes", "/insights", "/colheitas", "/insumos", "/simulacao", "/noticias", "/lembretes"],
    [],
  );
  const isHeaderExcludedRoute = useMemo(
    () =>
      headerExcludedPrefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      ),
    [headerExcludedPrefixes, pathname],
  );
  const hideFazendaSelector = isHeaderExcludedRoute || hideHeaderInput;

  const usuario = useAuthStore((s) => s.usuario);
  const menu = useAuthStore((s) => s.menu);
  const clearSession = useAuthStore((s) => s.clearSession);
  const fazendaSelecionada = useAuthStore((s) => s.fazendaSelecionada);
  const setFazendaSelecionada = useAuthStore((s) => s.setFazendaSelecionada);

  const { data: fazendas = [] } = useFazendaListQuery({ enabled: !hideFazendaSelector });
  const { data: notificacoesPayload, isLoading: carregandoNotificacoes } = useNotificacoesQuery({
    enabled: Boolean(usuario?.id),
    limit: 30,
  });
  const marcarComoLidaMutation = useMarcarNotificacaoComoLidaMutation();
  const marcarTodasComoLidasMutation = useMarcarTodasNotificacoesComoLidasMutation();

  const safeMenu = useMemo(
    () => ensureMenuComplete(menu, usuario?.role),
    [menu, usuario?.role],
  );
  const defaultExpanded = useMemo(
    () => new Set(getDefaultExpandedGroupIds(safeMenu, pathname)),
    [safeMenu, pathname],
  );
  const [expandedGroups, setExpandedGroups] = useState(() => new Set(defaultExpanded));
  const fazendaOptions = useMemo(() => buildFazendaOptions(fazendas), [fazendas]);
  const fazendaSelecionadaLabel = useMemo(
    () => getFazendaSelecionadaLabel(fazendaOptions, fazendaSelecionada),
    [fazendaOptions, fazendaSelecionada],
  );
  const isAdmin = usuario?.role === "ADMIN";
  const notificacoes = useMemo(() => notificacoesPayload?.items ?? [], [notificacoesPayload]);
  const unreadCount = notificacoesPayload?.unreadCount ?? 0;
  const unreadMarcaveis = notificacoesPayload?.unreadMarcaveis ?? unreadCount;
  const temArrendamentoPendente = unreadCount > unreadMarcaveis;

  useEffect(() => {
    const id = setTimeout(() => {
      setExpandedGroups((previous) => {
        const merged = new Set(previous);
        for (const groupId of defaultExpanded) {
          merged.add(groupId);
        }
        return merged;
      });
    }, 0);
    return () => clearTimeout(id);
  }, [defaultExpanded]);

  function handleToggleGroup(groupId) {
    setExpandedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      /* Mesmo com erro de rede, encerra sessão local. */
    } finally {
      clearSession();
      setMenuOpen(false);
      navigate("/login", { replace: true });
    }
  }

  function handleVerNotificacao(notificacao) {
    if (!notificacao?.id) return;

    const isArrendamento = notificacao.tipo === "ARRENDAMENTO_RECEBER";

    if (!isArrendamento && !notificacao.lidaEm && notificacao.permiteMarcarLida !== false) {
      marcarComoLidaMutation.mutate(notificacao.id);
    }

    setNotificacaoDropdownAberto(false);
    navigate(notificacao.rota || "/");
  }

  function handleMarcarComoLida(notificacaoId) {
    if (!notificacaoId) return;
    marcarComoLidaMutation.mutate(notificacaoId);
  }

  const LogoutIcon = ICON_MAP.logout;

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full shrink-0 border-b border-gray-200 bg-white shadow-sm"
      >
        <div className="flex h-14 w-full items-center justify-between px-4 sm:px-5">

          {/* Dashboard: desktop colapsa sidebar; mobile abre drawer */}
          <>
            <button
              type="button"
              className="hidden rounded-lg p-2 text-[var(--agro-brand)] transition-colors hover:bg-[var(--agro-brand)]/10 active:bg-[var(--agro-brand)]/15 lg:inline-flex"
              onClick={onToggleSidebar}
              aria-label="Alternar menu lateral"
            >
              <IconMenu />
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-[var(--agro-brand)] transition-colors hover:bg-[var(--agro-brand)]/10 active:bg-[var(--agro-brand)]/15 lg:hidden"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {menuOpen ? <IconClose /> : <IconMenu />}
            </button>
          </>

          {/* Mobile: logo (sidebar mostra logo no desktop) */}
          <span className="text-sm font-semibold text-[var(--agro-brand)] lg:hidden">Fazenda</span>

          {/* Desktop: seletor central exceto nas telas excluídas */}
          {!hideFazendaSelector ? (
            <div className="hidden min-w-0 flex-1 justify-center lg:flex">
              <div className="relative w-full max-w-[22rem]">
                <button
                  type="button"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 pr-10 text-left text-sm font-semibold text-gray-800 transition-colors hover:border-gray-300 hover:bg-white"
                  onClick={() => setFazendaDropdownAberto((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={fazendaDropdownAberto}
                >
                  {fazendaSelecionadaLabel}
                </button>
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

                {fazendaDropdownAberto && (
                  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setFazendaDropdownAberto(false)} />
                )}
                {fazendaDropdownAberto && (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    {fazendaOptions.map((opcao) => (
                      <button
                        key={opcao.id}
                        type="button"
                        className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-gray-100 ${
                          fazendaSelecionada === opcao.id ? "font-medium text-[var(--agro-brand)]" : "text-gray-700"
                        }`}
                        onClick={() => {
                          setFazendaSelecionada(opcao.id);
                          setFazendaDropdownAberto(false);
                        }}
                      >
                        {opcao.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden flex-1 lg:block" />
          )}
          {/* Área do usuário — visível em todos os tamanhos */}
          <div className="relative flex items-center gap-1.5 text-gray-600">
            <button
              type="button"
              className="relative rounded-lg p-2 transition-colors hover:bg-gray-100 hover:text-gray-800"
              aria-label="Notificações"
              onClick={() => setNotificacaoDropdownAberto((prev) => !prev)}
            >
              <IconBell />
              <span className="absolute right-1 top-1 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#74c47b] px-0.5 text-[9px] font-semibold leading-none text-[#0f3c1a]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </button>

            {notificacaoDropdownAberto ? (
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setNotificacaoDropdownAberto(false)} />
            ) : null}

            {notificacaoDropdownAberto ? (
              <section className="absolute right-0 top-[calc(100%+8px)] z-20 w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Notificações</p>
                    <SoftBadge tone="emerald">
                      {unreadCount} não lida{unreadCount === 1 ? "" : "s"}
                    </SoftBadge>
                  </div>

                  {unreadMarcaveis > 0 ? (
                    <button
                      type="button"
                      className="inline-flex h-8 items-center rounded-lg border border-gray-200 px-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => marcarTodasComoLidasMutation.mutate()}
                      disabled={marcarTodasComoLidasMutation.isPending}
                      title={
                        temArrendamentoPendente
                          ? "Arrendamento pendente só some ao confirmar recebimento em Lucros"
                          : undefined
                      }
                    >
                      Marcar todas ({unreadMarcaveis})
                    </button>
                  ) : null}
                </header>

                {temArrendamentoPendente ? (
                  <p className="border-b border-amber-100 bg-amber-50/90 px-4 py-2 text-[11px] leading-snug text-amber-900">
                    {unreadCount - unreadMarcaveis}{" "}
                    {unreadCount - unreadMarcaveis === 1 ? "notificação" : "notificações"} de arrendamento
                    permanecem até você
                    confirmar o recebimento em Lucros.
                  </p>
                ) : null}

                <div className="max-h-[70vh] overflow-y-auto p-3">
                  {carregandoNotificacoes ? (
                    <p className="px-2 py-4 text-sm text-gray-500">Carregando notificações...</p>
                  ) : notificacoes.length === 0 ? (
                    <p className="px-2 py-4 text-sm text-gray-500">Você não possui notificações no momento.</p>
                  ) : (
                    <ul className="space-y-2">
                      {notificacoes.map((notificacao) => {
                        const lida = Boolean(notificacao.lidaEm);

                        return (
                          <li
                            key={notificacao.id}
                            className={`rounded-xl border p-3 shadow-sm ${getNotificacaoCardClass(notificacao.tipo, notificacao.tipoVisual)} ${
                              lida ? "opacity-70" : "ring-1 ring-inset ring-black/5"
                            }`}
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <NotificacaoTipoBadge
                                tipo={notificacao.tipo}
                                tipoVisual={notificacao.tipoVisual}
                                className="text-[10px]"
                              />
                              <span className="text-[11px] text-gray-500">{formatarDataNotificacao(notificacao.criadoEm)}</span>
                            </div>

                            <p className="text-sm font-semibold text-gray-900">{notificacao.titulo}</p>
                            {notificacao.descricao ? (
                              <p className="mt-1 text-xs leading-relaxed text-gray-600">{notificacao.descricao}</p>
                            ) : null}

                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleVerNotificacao(notificacao)}
                                className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                              >
                                <IconEye className="h-3.5 w-3.5 shrink-0" />
                                Ver mais
                              </button>

                              {notificacao.tipo !== "ARRENDAMENTO_RECEBER" && notificacao.permiteMarcarLida !== false ? (
                                <button
                                  type="button"
                                  onClick={() => handleMarcarComoLida(notificacao.id)}
                                  disabled={lida || marcarComoLidaMutation.isPending}
                                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                  <IconCheck className="h-3.5 w-3.5" />
                                  {lida ? "Lida" : "Marcar como lido"}
                                </button>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            ) : null}

            <button
              type="button"
              className="rounded-lg p-2 transition-colors hover:bg-gray-100 hover:text-gray-800"
              aria-label={usuario?.nome ? `Usuário ${usuario.nome}` : "Usuário"}
            >
              <IconUserOutline />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer mobile — lg:hidden via classe no wrapper */}
      <div
        className={`fixed inset-0 z-50 flex transition-opacity duration-300 ease-in-out lg:hidden ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
          onClick={() => setMenuOpen(false)}
          aria-label="Fechar menu"
          tabIndex={menuOpen ? 0 : -1}
        />

        {/* Painel lateral mobile */}
        <nav
          className={`relative flex h-full w-72 max-w-[88vw] flex-col bg-[var(--agro-brand)] px-4 py-5 text-white shadow-2xl transition-transform duration-300 ease-in-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between pb-4">
            <img src={logoBranca} alt="AgroFarm" className="h-9 w-auto object-contain" />
            <button
              type="button"
              className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
              aria-label="Fechar menu"
            >
              <IconClose />
            </button>
          </div>

          <div className="h-px w-full bg-white/20" />

          <div className="mt-4 rounded-xl border border-white/15 bg-white/6 px-3 py-3">
            <div className="flex items-center gap-3">
              <UserAvatar />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {usuario?.nome ?? "Usuário"}
                </p>
                <p className="text-xs text-white/65">
                  {usuario?.role === "ADMIN" ? "Administrador" : "Funcionário"}
                </p>
              </div>
            </div>
          </div>

          <div className="scrollbar-sidebar mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
            {safeMenu.length > 0 ? (
              <ul className="space-y-1">
                {safeMenu.map((item) => (
                  <SidebarNavItem
                    key={item.id}
                    item={item}
                    pathname={pathname}
                    expandedGroups={expandedGroups}
                    onToggleGroup={handleToggleGroup}
                    onNavigate={() => setMenuOpen(false)}
                  />
                ))}
              </ul>
            ) : (
              <div className="space-y-1.5">
                <div className="h-10 rounded-xl bg-white/10" />
                <div className="h-10 rounded-xl bg-white/8" />
                <div className="h-10 rounded-xl bg-white/6" />
              </div>
            )}
          </div>

          <div className="mt-4 h-px w-full bg-white/20" />

          <button
            type="button"
            className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-left text-white/90 transition-colors hover:bg-white/10"
            onClick={handleLogout}
          >
            <LogoutIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </nav>
      </div>
    </>
  );
}
