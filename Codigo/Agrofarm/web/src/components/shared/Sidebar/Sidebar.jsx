import { useEffect, useMemo, useRef, useState } from "react";
import { useUiStore } from "../../../store/uiStore.js";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoBranca from "../../../assets/img/AgroFarmBranca.png";
import logoCompacta from "../../../assets/img/Agrofarm_logo.jpg";
import { useCotacaoMercadoQuery } from "../../../queries/cotacao/useCotacaoQueries.js";
import { logout } from "../../../services/auth/auth.service.js";
import { useAuthStore } from "../../../store/authStore.js";
import SidebarNavItem from "./SidebarNavItem.jsx";
import { ensureMenuComplete } from "../../../lib/ensureMenuComplete.js";
import { getDefaultExpandedGroupIds } from "./sidebarNav.utils.js";
import { ICON_MAP } from "./sidebarIconMap.js";

function IconChevronLeft(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconChevronDown(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconTrendUp(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M4 16l5-5 4 4 7-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrendDown(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M4 8l5 5 4-4 7 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 16h5v-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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

function getUserInitials(nome) {
  if (!nome || typeof nome !== "string") return "US";
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "US";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ""}${partes[1][0] ?? ""}`.toUpperCase();
}

function formatarMoedaBR(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor ?? 0));
}

function formatarValorMercado(valor, moeda) {
  if (valor == null || valor === "") return "--";
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "--";

  if (moeda === "BRL") {
    return formatarMoedaBR(numero);
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numero);
}

function formatarVariacaoPercentual(variacao) {
  if (variacao == null || Number.isNaN(Number(variacao))) return "--";
  const numero = Number(variacao);
  const sinal = numero > 0 ? "+" : "";
  return `${sinal}${numero.toFixed(2).replace(".", ",")}%`;
}

function formatarHoraBR(valor) {
  if (!valor) return null;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const usuario = useAuthStore((s) => s.usuario);
  const menu = useAuthStore((s) => s.menu);
  const clearSession = useAuthStore((s) => s.clearSession);

  const safeMenu = useMemo(
    () => ensureMenuComplete(menu, usuario?.role),
    [menu, usuario?.role],
  );
  const defaultExpanded = useMemo(
    () => new Set(getDefaultExpandedGroupIds(safeMenu, pathname)),
    [safeMenu, pathname],
  );
  const [expandedGroups, setExpandedGroups] = useState(() => new Set(defaultExpanded));
  const isCotacoesMinimized = useUiStore((s) => s.sidebarCotacoesMinimized);
  const toggleSidebarCotacoesMinimized = useUiStore((s) => s.toggleSidebarCotacoesMinimized);
  const setSidebarCotacoesMinimized = useUiStore((s) => s.setSidebarCotacoesMinimized);
  const cotacoesSectionRef = useRef(null);
  const focusSidebarCotacoes = useUiStore((s) => s.focusSidebarCotacoes);
  const clearSidebarCotacoesFocus = useUiStore((s) => s.clearSidebarCotacoesFocus);
  const [selectedCommodityIds, setSelectedCommodityIds] = useState([]);
  const [hasCommodityFilterInitialized, setHasCommodityFilterInitialized] = useState(false);

  const { data: mercadoData } = useCotacaoMercadoQuery({
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const id = setTimeout(() => {
      setExpandedGroups((prev) => {
        const merged = new Set(prev);
        for (const gid of defaultExpanded) merged.add(gid);
        return merged;
      });
    }, 0);
    return () => clearTimeout(id);
  }, [defaultExpanded]);

  useEffect(() => {
    if (!focusSidebarCotacoes || collapsed) return;
    setSidebarCotacoesMinimized(false);
    const timer = window.setTimeout(() => {
      const nav = document.querySelector(".scrollbar-sidebar");
      const alvo = cotacoesSectionRef.current;
      if (nav && alvo) {
        const navRect = nav.getBoundingClientRect();
        const alvoRect = alvo.getBoundingClientRect();
        nav.scrollTo({
          top: nav.scrollTop + (alvoRect.top - navRect.top) - 12,
          behavior: "smooth",
        });
      } else {
        alvo?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      clearSidebarCotacoesFocus();
    }, 280);
    return () => window.clearTimeout(timer);
  }, [focusSidebarCotacoes, collapsed, clearSidebarCotacoesFocus, setSidebarCotacoesMinimized]);

  function handleToggleGroup(groupId) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      /* Mesmo com falha de rede, encerra sessão local. */
    } finally {
      clearSession();
      navigate("/login", { replace: true });
    }
  }

  const LogoutIcon = ICON_MAP.logout;
  const userInitials = getUserInitials(usuario?.nome);
  const valorDolarAtual = Number(mercadoData?.dolar?.valor);
  const valorEuroAtual = Number(mercadoData?.euro?.valor);

  const variacaoDolar = mercadoData?.dolar?.variacao;
  const variacaoEuro = mercadoData?.euro?.variacao;
  const commoditiesDisponiveis = useMemo(() => {
    const commodities = Array.isArray(mercadoData?.commodities) ? mercadoData.commodities : [];

    return commodities.map((item, index) => {
      const rawId = item?.id ?? item?.symbol ?? item?.nome ?? `commodity-${index + 1}`;
      return {
        ...item,
        id: String(rawId).toLowerCase(),
        nome: item?.nome ?? `Commodity ${index + 1}`,
      };
    });
  }, [mercadoData]);

  useEffect(() => {
    const idsDisponiveis = commoditiesDisponiveis.map((item) => item.id);

    if (idsDisponiveis.length === 0) {
      setSelectedCommodityIds([]);
      return;
    }

    setSelectedCommodityIds((prev) => {
      if (!hasCommodityFilterInitialized) {
        return idsDisponiveis;
      }

      return prev.filter((id) => idsDisponiveis.includes(id));
    });

    if (!hasCommodityFilterInitialized) {
      setHasCommodityFilterInitialized(true);
    }
  }, [commoditiesDisponiveis, hasCommodityFilterInitialized]);

  const ultimaHoraAtualizacao = useMemo(() => {
    const horarios = [
      formatarHoraBR(mercadoData?.dolar?.atualizadoEm),
      formatarHoraBR(mercadoData?.euro?.atualizadoEm),
      ...((Array.isArray(mercadoData?.commodities) ? mercadoData.commodities : [])
        .map((item) => formatarHoraBR(item?.atualizadoEm))
        .filter(Boolean)),
    ].filter(Boolean);

    return horarios[0] ?? null;
  }, [mercadoData]);

  const cotacoes = useMemo(
    () => {
      return [
      {
        id: "dolar",
        nome: "Dólar (USD/BRL)",
        valor: formatarValorMercado(valorDolarAtual, "BRL"),
        variacao: formatarVariacaoPercentual(variacaoDolar),
        positiva: variacaoDolar == null ? true : variacaoDolar >= 0,
        detalhe: "Câmbio comercial · fonte AwesomeAPI",
      },
      {
        id: "euro",
        nome: "Euro (EUR/BRL)",
        valor: formatarValorMercado(valorEuroAtual, "BRL"),
        variacao: formatarVariacaoPercentual(variacaoEuro),
        positiva: variacaoEuro == null ? true : variacaoEuro >= 0,
        detalhe: "Câmbio comercial · fonte AwesomeAPI",
      },
      ...commoditiesDisponiveis
        .filter((item) => selectedCommodityIds.includes(item.id))
        .map((item) => ({
          id: item.id,
          nome: `${item.nome} (futuro)`,
          valor: formatarValorMercado(item?.valor, item?.moeda),
          variacao: formatarVariacaoPercentual(item?.variacao),
          positiva: item?.variacao == null ? true : Number(item.variacao) >= 0,
          detalhe: item?.fonte === "sem-cotacao-mapeada"
            ? "Sem cotação em tempo real para esta cultura"
            : `${item?.unidade ?? "Unidade não informada"} · ${item?.fonte === "yahoo-finance" ? "Yahoo Finance" : "Mercado"}`,
        })),
    ];
    },
    [commoditiesDisponiveis, selectedCommodityIds, valorDolarAtual, valorEuroAtual, variacaoDolar, variacaoEuro],
  );

  const culturasSelecionadasRotulo = useMemo(() => {
    if (commoditiesDisponiveis.length === 0) {
      return "Sem culturas com commodities disponíveis";
    }

    if (selectedCommodityIds.length === commoditiesDisponiveis.length) {
      return `Exibindo todas as culturas (${commoditiesDisponiveis.length})`;
    }

    if (selectedCommodityIds.length === 0) {
      return "Nenhuma cultura selecionada";
    }

    const nomes = commoditiesDisponiveis
      .filter((item) => selectedCommodityIds.includes(item.id))
      .map((item) => item.nome);

    return `Exibindo apenas: ${nomes.join(", ")}`;
  }, [commoditiesDisponiveis, selectedCommodityIds]);

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen shrink-0 text-white transition-all duration-300 ease-in-out overflow-hidden border-r border-white/10 bg-[linear-gradient(180deg,#073a2f_0%,#042820_35%,#031a15_100%)] ${
        collapsed ? "w-[78px]" : "w-[272px]"
      }`}
    >
      {/* Topo: branding + toggle */}
      <div className={`flex h-16 items-center px-3 shrink-0 ${collapsed ? "justify-center" : "justify-between"}`}>
        <Link to="/" className="min-w-0">
          {collapsed ? (
            <img src={logoCompacta} alt="AgroFarm" className="h-9 w-9 rounded-md object-contain" />
          ) : (
            <img src={logoBranca} alt="AgroFarm" className="h-8 w-auto object-contain" />
          )}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/75 transition-colors hover:bg-white/10 hover:text-white ${
            collapsed ? "hidden" : ""
          }`}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <IconChevronLeft
            className={`h-[18px] w-[18px] transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <div className="mx-3 h-px bg-white/15 shrink-0" />

      {/* Navegação */}
      <nav className="scrollbar-sidebar mt-3 min-h-0 flex-1 overflow-y-auto px-2">
        {safeMenu.length > 0 ? (
          <ul className="space-y-1.5 pb-2">
            {safeMenu.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                pathname={pathname}
                expandedGroups={expandedGroups}
                onToggleGroup={handleToggleGroup}
                collapsed={collapsed}
              />
            ))}

            {!collapsed ? (
              <li className="pt-2">
                <section
                  ref={cotacoesSectionRef}
                  id="sidebar-cotacoes-commodities"
                  className="rounded-2xl border border-white/12 bg-white/[0.05] p-3"
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">Cotações e commodities</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-white/45">{ultimaHoraAtualizacao ? `Atualizado ${ultimaHoraAtualizacao}` : "Agora"}</span>
                      <button
                        type="button"
                        onClick={toggleSidebarCotacoesMinimized}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label={isCotacoesMinimized ? "Expandir cotações e commodities" : "Minimizar cotações e commodities"}
                      >
                        <IconChevronDown className={`h-4 w-4 transition-transform ${isCotacoesMinimized ? "-rotate-90" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {!isCotacoesMinimized ? (
                    <>
                      <div className="mb-2.5 rounded-xl border border-white/10 bg-white/[0.035] px-2.5 py-2">
                        <p className="text-[10px] leading-relaxed text-white/65">{culturasSelecionadasRotulo}</p>
                        {commoditiesDisponiveis.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedCommodityIds(commoditiesDisponiveis.map((item) => item.id))}
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold transition-colors ${
                                selectedCommodityIds.length === commoditiesDisponiveis.length
                                  ? "bg-[#66e8b4]/25 text-[#c4ffe2]"
                                  : "bg-white/10 text-white/70 hover:bg-white/15"
                              }`}
                            >
                              Todas
                            </button>
                            {commoditiesDisponiveis.map((commodity) => {
                              const ativo = selectedCommodityIds.includes(commodity.id);
                              return (
                                <button
                                  key={commodity.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCommodityIds((prev) => {
                                      if (prev.includes(commodity.id)) {
                                        return prev.filter((id) => id !== commodity.id);
                                      }
                                      return [...prev, commodity.id];
                                    });
                                  }}
                                  className={`rounded-full px-2 py-1 text-[10px] font-semibold transition-colors ${
                                    ativo
                                      ? "bg-[#66e8b4]/25 text-[#c4ffe2]"
                                      : "bg-white/10 text-white/70 hover:bg-white/15"
                                  }`}
                                >
                                  {commodity.nome}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-2.5">
                        {cotacoes.map((cotacao) => {
                          const TrendIcon = cotacao.positiva ? IconTrendUp : IconTrendDown;
                          return (
                            <article key={cotacao.id} className="rounded-xl bg-white/[0.04] px-2.5 py-2">
                              <p className="truncate text-[11px] text-white/65">{cotacao.nome}</p>
                              <p className="mt-0.5 truncate text-[10px] text-white/45">{cotacao.detalhe}</p>
                              <div className="mt-1 flex items-center justify-between">
                                <p className="text-sm font-semibold text-white">{cotacao.valor}</p>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                    cotacao.positiva
                                      ? "bg-[#14865f]/25 text-[#8fe8b3]"
                                      : "bg-[#8b2432]/30 text-[#ff9faa]"
                                  }`}
                                >
                                  <TrendIcon className="h-3 w-3" />
                                  {cotacao.variacao}
                                </span>
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      <p className="mt-2.5 text-[10px] leading-relaxed text-white/50">
                        As commodities representam contratos futuros internacionais e podem diferir do preço físico local.
                      </p>
                    </>
                  ) : null}
                </section>
              </li>
            ) : null}

          </ul>
        ) : (
          <div className={`space-y-1.5 ${collapsed ? "flex flex-col items-center" : ""}`}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-10 rounded-xl bg-white/10 ${collapsed ? "w-11" : "w-full"}`}
              />
            ))}
          </div>
        )}
      </nav>

      <div className="mx-3 h-px bg-white/15 shrink-0" />

      {/* Bloco do usuário no rodapé */}
      <div className={`mx-3 mt-3 rounded-2xl border border-white/15 bg-white/[0.07] ${collapsed ? "p-2" : "px-3 py-3"}`}>
        {collapsed ? (
          <div className="flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0c5f47] text-xs font-semibold text-white">
              {userInitials}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <UserAvatar />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white leading-tight">
                {usuario?.nome ?? "Usuário"}
              </p>
              <p className="mt-0.5 text-xs text-white/65">
                {usuario?.role === "ADMIN" ? "Administrador" : "Funcionário"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        title={collapsed ? "Sair" : undefined}
        className={`m-3 shrink-0 flex items-center gap-3 rounded-xl px-3 py-2.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <LogoutIcon className="h-5 w-5 shrink-0" />
        {!collapsed && <span className="text-sm font-medium">Sair</span>}
      </button>

      {/* Toggle dedicado no modo colapsado */}
      {collapsed ? (
        <button
          type="button"
          onClick={onToggle}
          className="mx-3 mb-3 flex h-9 w-auto items-center justify-center rounded-xl text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Expandir menu"
        >
          <IconChevronLeft className="h-[18px] w-[18px] rotate-180" />
        </button>
      ) : null}
    </aside>
  );
}
