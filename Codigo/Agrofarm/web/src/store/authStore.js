import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ensureMenuComplete } from "../lib/ensureMenuComplete.js";
import { appQueryClient } from "../lib/queryClient.js";
import { createFazendaSlice, FAZENDA_TODAS_VALUE } from "./slices/fazendaSlice.js";

export const useAuthStore = create(
  persist(
    (set) => ({
      ...createFazendaSlice(set),
      token: null,
      usuario: null,
      menu: [],
      setSession: (tokenOrSession, usuarioArg, menuArg = []) => {
        if (typeof tokenOrSession === "object" && tokenOrSession !== null) {
          const session = tokenOrSession;
          const usuario = session.usuario ?? null;
          set({
            token: session.token ?? null,
            usuario,
            menu: ensureMenuComplete(session.menu, usuario?.role),
          });
          return;
        }

        const usuario = usuarioArg ?? null;
        set({
          token: tokenOrSession ?? null,
          usuario,
          menu: ensureMenuComplete(menuArg, usuario?.role),
        });
      },
      hydrateSession: ({ usuario, menu }) =>
        set((state) => {
          const nextUsuario = usuario ?? state.usuario;
          const rawMenu = Array.isArray(menu) ? menu : state.menu;
          return {
            token: state.token,
            usuario: nextUsuario,
            menu: ensureMenuComplete(rawMenu, nextUsuario?.role),
          };
        }),
      clearSession: () => {
        appQueryClient.clear();
        set({
          token: null,
          usuario: null,
          menu: [],
          fazendaSelecionada: FAZENDA_TODAS_VALUE,
        });
      },
    }),
    { name: "agrofarm-auth" },
  ),
);
