import { create } from "zustand";

const COTACOES_MIN_KEY = "agrofarm.sidebar.cotacoesMinimized";

function readCotacoesMinimized() {
  try {
    return localStorage.getItem(COTACOES_MIN_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCotacoesMinimized(value) {
  try {
    localStorage.setItem(COTACOES_MIN_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export const useUiStore = create((set) => ({
  sidebarExpanded: false,
  sidebarCotacoesMinimized: readCotacoesMinimized(),
  focusSidebarCotacoes: false,
  requestSidebarCotacoes: () =>
    set({ focusSidebarCotacoes: true, sidebarExpanded: true }),
  clearSidebarCotacoesFocus: () => set({ focusSidebarCotacoes: false }),
  consumeSidebarExpanded: () => set({ sidebarExpanded: false }),
  setSidebarCotacoesMinimized: (minimized) => {
    writeCotacoesMinimized(minimized);
    set({ sidebarCotacoesMinimized: minimized });
  },
  toggleSidebarCotacoesMinimized: () =>
    set((state) => {
      const next = !state.sidebarCotacoesMinimized;
      writeCotacoesMinimized(next);
      return { sidebarCotacoesMinimized: next };
    }),
}));
