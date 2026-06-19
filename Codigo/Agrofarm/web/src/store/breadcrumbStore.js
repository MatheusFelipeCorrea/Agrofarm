import { create } from "zustand";

export const useBreadcrumbStore = create((set) => ({
  items: null,
  setItems: (items) => set({ items: items?.length ? items : null }),
  clearItems: () => set({ items: null }),
}));
