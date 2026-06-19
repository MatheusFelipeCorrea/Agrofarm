import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";
import { collectAllowedPaths, isAuthPublicPath } from "../../routes/routeAccess.js";

const FAB_VISIBILITY_POLICY_KEY = "agrofarm.chat-fab.policy";
const HALF_DAY_IN_MS = 12 * 60 * 60 * 1000;

function IconChat(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M8 10h8M8 14h5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M21 11.5a8.5 8.5 0 01-8.5 8.5H7l-4 2 1.3-4.3A8.5 8.5 0 1112.5 3 8.5 8.5 0 0121 11.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function resolveChatbotPath(menu) {
  if (!Array.isArray(menu)) return "/chatbot";

  for (const item of menu) {
    if (!item) continue;
    const rotulo = String(item.label ?? "").toLowerCase();
    const icone = String(item.icon ?? item.iconName ?? "").toLowerCase();

    if (rotulo.includes("chat") || icone.includes("chat") || rotulo.includes("insight ia")) {
      if (typeof item.path === "string" && item.path.trim()) return item.path;
    }

    const children = Array.isArray(item.children) ? item.children : [];
    for (const child of children) {
      const childLabel = String(child?.label ?? "").toLowerCase();
      const childIcon = String(child?.icon ?? child?.iconName ?? "").toLowerCase();

      if (childLabel.includes("chat") || childIcon.includes("chat") || childLabel.includes("insight ia")) {
        if (typeof child?.path === "string" && child.path.trim()) return child.path;
      }
    }
  }

  return "/chatbot";
}

function getDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNextDayStartTimestamp(now) {
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 0, 0);
  return nextDay.getTime();
}

function readFabPolicy() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(FAB_VISIBILITY_POLICY_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return {
      dayKey: typeof parsed?.dayKey === "string" ? parsed.dayKey : null,
      dismissCount: Number(parsed?.dismissCount) || 0,
      hiddenUntil: Number(parsed?.hiddenUntil) || 0,
    };
  } catch {
    return null;
  }
}

function writeFabPolicy(policy) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAB_VISIBILITY_POLICY_KEY, JSON.stringify(policy));
}

function canShowFabNow() {
  if (typeof window === "undefined") return true;

  const now = new Date();
  const nowTs = now.getTime();
  const todayKey = getDayKey(now);
  const policy = readFabPolicy();

  if (!policy) return true;
  if (policy.hiddenUntil > nowTs) return false;

  if (policy.dayKey !== todayKey) {
    writeFabPolicy({
      dayKey: todayKey,
      dismissCount: 0,
      hiddenUntil: 0,
    });
    return true;
  }

  return policy.dismissCount < 2;
}

function markFabDismissed() {
  if (typeof window === "undefined") return;

  const now = new Date();
  const nowTs = now.getTime();
  const todayKey = getDayKey(now);
  const existing = readFabPolicy();

  const dismissCountBase = existing?.dayKey === todayKey ? existing.dismissCount : 0;
  const dismissCount = dismissCountBase + 1;
  const hiddenUntil = dismissCount >= 2
    ? getNextDayStartTimestamp(now)
    : nowTs + HALF_DAY_IN_MS;

  writeFabPolicy({ dayKey: todayKey, dismissCount, hiddenUntil });
}

export default function FloatingChatFab() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const token = useAuthStore((s) => s.token);
  const menu = useAuthStore((s) => s.menu);
  const [isVisible, setIsVisible] = useState(canShowFabNow);

  const chatbotPath = useMemo(() => resolveChatbotPath(menu), [menu]);
  const podeAcessarChatbot = useMemo(
    () => collectAllowedPaths(menu).includes("/chatbot"),
    [menu],
  );

  useEffect(() => {
    setIsVisible(canShowFabNow());
  }, [pathname, token]);

  useEffect(() => {
    if (isVisible) return undefined;

    const timer = setInterval(() => {
      if (canShowFabNow()) {
        setIsVisible(true);
      }
    }, 60_000);

    return () => clearInterval(timer);
  }, [isVisible]);

  if (!token || !podeAcessarChatbot || !isVisible || isAuthPublicPath(pathname) || pathname === chatbotPath) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[120] sm:bottom-6 sm:right-6">
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            markFabDismissed();
            setIsVisible(false);
          }}
          className="absolute -top-2 -right-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/25 bg-[#0f3a2f] text-white/85 shadow-lg transition-colors hover:bg-[#164c3f]"
          aria-label="Fechar botão do chatbot"
        >
          <span className="text-xs font-semibold leading-none">x</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(chatbotPath)}
          className="group inline-flex items-center gap-2.5 rounded-full border border-[#73efbe]/45 bg-[linear-gradient(135deg,#0f7d5c,#0a6046)] px-4 py-3 text-white shadow-[0_14px_28px_rgba(4,25,19,0.38)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#a4ffd8] hover:shadow-[0_18px_30px_rgba(4,25,19,0.45)]"
          aria-label="Abrir chatbot"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/18">
            <IconChat className="h-4.5 w-4.5" />
          </span>
          <span className="text-sm font-semibold tracking-[0.01em]">Chatbot</span>
        </button>
      </div>
    </div>
  );
}
