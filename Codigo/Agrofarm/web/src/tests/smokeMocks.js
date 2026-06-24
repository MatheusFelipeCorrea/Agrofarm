import { vi } from "vitest";

export function createMockQuery(data = null, overrides = {}) {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false,
    isSuccess: true,
    status: "success",
    refetch: vi.fn(),
    ...overrides,
  };
}

export function createMockMutation(overrides = {}) {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    ...overrides,
  };
}

export function createMockInfiniteQuery(overrides = {}) {
  return {
    data: {
      pages: [
        {
          items: [],
          destaque: null,
          categorias: [],
          temas: [],
          fontes: [],
        },
      ],
    },
    isLoading: false,
    isError: false,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    ...overrides,
  };
}

export function createMockAuthState(overrides = {}) {
  return {
    token: null,
    usuario: {
      id: "user-smoke-1",
      role: "ADMIN",
      nome: "Admin Smoke",
      email: "admin@smoke.test",
      fazendasVinculadas: [],
    },
    menu: [
      { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: "dashboard", children: [] },
      { id: "fazendas", label: "Fazendas", path: "/fazendas", icon: "fazendas", children: [] },
      { id: "gastos", label: "Gastos", path: "/gastos", icon: "gastos", children: [] },
    ],
    fazendaSelecionada: "todas",
    setSession: vi.fn(),
    clearSession: vi.fn(),
    hydrateSession: vi.fn(),
    setFazendaSelecionada: vi.fn(),
    resetFazendaSelecionada: vi.fn(),
    ...overrides,
  };
}
