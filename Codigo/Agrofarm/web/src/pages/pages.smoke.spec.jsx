import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import {
  createMockInfiniteQuery,
  createMockMutation,
  createMockQuery,
} from "../tests/smokeMocks.js";
import { renderWithProviders } from "../tests/renderWithProviders.jsx";

const { authState } = vi.hoisted(() => ({
  authState: {
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
    ],
    fazendaSelecionada: "todas",
    setSession: vi.fn(),
    clearSession: vi.fn(),
    hydrateSession: vi.fn(),
    setFazendaSelecionada: vi.fn(),
    resetFazendaSelecionada: vi.fn(),
  },
}));

vi.mock("../store/authStore.js", () => ({
  useAuthStore: (selector) => (typeof selector === "function" ? selector(authState) : authState),
}));

vi.mock("../services/auth/auth.service.js", () => ({
  logout: vi.fn().mockResolvedValue(undefined),
  PasswordChangeRequiredError: class PasswordChangeRequiredError extends Error {},
}));

vi.mock("../services/cultura/cultura.service.js", () => ({
  listarCulturas: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/fazenda/fazenda.service.js", () => ({
  listarFazendas: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/colheita/colheita.service.js", () => ({
  listarColheitas: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/estoque/estoque.service.js", () => ({
  listarEstoque: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/poligono/poligono.service.js", () => ({
  listarPoligonos: vi.fn().mockResolvedValue([]),
}));

vi.mock("../pages/Chatbot/useChatbotWeather.js", () => ({
  useChatbotWeather: () => ({
    weatherQuery: createMockQuery({
      current: { temperature_2m: 25, wind_speed_10m: 10, precipitation: 0 },
    }),
    location: { label: "Patrocínio, MG", lat: -18.94, lon: -46.99 },
    setLocation: vi.fn(),
    searchLocation: vi.fn(),
    isSearching: false,
  }),
}));

vi.mock("maplibre-gl", () => ({
  default: {},
  Map: class Map {},
}));

vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children }) => <div data-testid="mock-map">{children}</div>,
  Map: ({ children }) => <div data-testid="mock-map">{children}</div>,
  Source: () => null,
  Layer: () => null,
  Marker: () => null,
  NavigationControl: () => null,
  ScaleControl: () => null,
}));

vi.mock("recharts", () => {
  const Box = ({ children }) => React.createElement("div", null, children);
  return {
    ResponsiveContainer: Box,
    PieChart: Box,
    Pie: Box,
    Cell: Box,
    Tooltip: Box,
    LineChart: Box,
    Line: Box,
    XAxis: Box,
    YAxis: Box,
    CartesianGrid: Box,
  };
});

vi.mock("../queries/auth/useAuthQueries.js", () => ({
  useLogin: () => createMockMutation(),
  useChangeInitialPassword: () => createMockMutation(),
  useChangePassword: () => createMockMutation(),
}));

vi.mock("../queries/fazenda/useFazendaQueries.js", () => ({
  QK_FAZENDAS: ["fazendas"],
  useFazendaListQuery: () => createMockQuery([]),
  useFazendaByIdQuery: () => createMockQuery(null),
  useFazendaDetalheQuery: () => createMockQuery(null),
  useCreateFazendaMutation: () => createMockMutation(),
  useUpdateFazendaMutation: () => createMockMutation(),
  useDeleteFazendaMutation: () => createMockMutation(),
  useCulturasDaFazendaQuery: () => createMockQuery([]),
  useAddCulturaNaFazendaMutation: () => createMockMutation(),
  useUpdateCulturaDaFazendaMutation: () => createMockMutation(),
  useDeleteCulturaDaFazendaMutation: () => createMockMutation(),
}));

vi.mock("../queries/cultura/useCulturaQueries.js", () => ({
  useCulturaListQuery: () => createMockQuery([]),
  useCreateCulturaMutation: () => createMockMutation(),
  useUpdateCulturaMutation: () => createMockMutation(),
  useDeleteCulturaMutation: () => createMockMutation(),
}));

vi.mock("../queries/gasto/useGastoQueries.js", () => ({
  useGastoListQuery: () => createMockQuery({ items: [], total: 0 }),
  useGastoResumoQuery: () => createMockQuery({ total: 0, pendentes: 0, pagos: 0 }),
  useCreateGastoMutation: () => createMockMutation(),
  useUpdateGastoMutation: () => createMockMutation(),
  useDeleteGastoMutation: () => createMockMutation(),
}));

vi.mock("../queries/colheita/useColheitaQueries.js", () => ({
  useColheitaListQuery: () => createMockQuery([]),
  useCreateColheitaMutation: () => createMockMutation(),
  useUpdateColheitaMutation: () => createMockMutation(),
  useDeleteColheitaMutation: () => createMockMutation(),
}));

vi.mock("../queries/lembrete/useLembreteQueries.js", () => ({
  useLembreteCalendarioQuery: () => createMockQuery([]),
  useLembreteDiaQuery: () => createMockQuery([]),
  useUpdateLembreteStatusMutation: () => createMockMutation(),
  useDeleteLembreteMutation: () => createMockMutation(),
  useUpdateLembreteMutation: () => createMockMutation(),
  useCreateLembreteMutation: () => createMockMutation(),
}));

vi.mock("../queries/lucro/useLucroQueries.js", () => ({
  useLucroListQuery: () => createMockQuery({ items: [], total: 0 }),
  useLucroTotalQuery: () => createMockQuery({ total: 0 }),
  useCreateLucroMutation: () => createMockMutation(),
  useUpdateLucroMutation: () => createMockMutation(),
  useDeleteLucroMutation: () => createMockMutation(),
}));

vi.mock("../queries/estoque/useEstoqueQueries.js", () => ({
  useEstoqueListQuery: () => createMockQuery({ items: [], total: 0, resumo: {} }),
  useEstoqueDetalheQuery: () => createMockQuery(null),
  useConfirmarEntregaArrendamentoMutation: () => createMockMutation(),
  useMarcarEntregaArrendamentoMutation: () => createMockMutation(),
}));

vi.mock("../queries/insumo/useInsumoQueries.js", () => ({
  useInsumoListQuery: () => createMockQuery({ items: [], total: 0 }),
  useCreateInsumoMutation: () => createMockMutation(),
  useUpdateInsumoMutation: () => createMockMutation(),
  useDeleteInsumoMutation: () => createMockMutation(),
}));

vi.mock("../queries/simulacao/useSimulacaoQueries.js", () => ({
  useGetDividasSimulacao: () => createMockQuery({ saldoAtual: 0, itens: [] }),
  useCalcularSacasMutation: () => createMockMutation(),
  useCotacaoSimulacaoQuery: () => createMockQuery({ usd: 1, brl: 5.5 }),
  usePré_carregarCotacoes: () => {},
  useSalvarSimulacaoMutation: () => createMockMutation(),
  useBuscarSimulacaoHistorico: () => createMockQuery([]),
  useExcluirSimulacaoMutation: () => createMockMutation(),
}));

vi.mock("../queries/ia/useIAQueries.js", () => ({
  INSIGHTS_AUTO_REFRESH_MS: 60_000,
  useInsightsQuery: () =>
    createMockQuery({
      saudacao: { texto: "Olá" },
      estoque: null,
      financeiro: null,
      comparativoFazendas: [],
    }),
  useRefreshInsightMutation: () => createMockMutation(),
}));

vi.mock("../queries/chatbot/useChatbotQueries.js", () => ({
  CHATBOT_SESSOES_KEY: ["chatbot", "sessoes"],
  CHATBOT_RESUMO_KEY: ["chatbot", "resumo"],
  chatbotMensagensKey: (id) => ["chatbot", "mensagens", id],
  useChatbotResumoQuery: () => createMockQuery({ totalMensagens: 0 }),
  useChatbotSessoesQuery: () => createMockQuery([]),
  useChatbotMensagensQuery: () => createMockQuery([]),
  useChatbotEnviarMutation: () => createMockMutation(),
  useChatbotRenomearSessaoMutation: () => createMockMutation(),
  useChatbotExcluirSessaoMutation: () => createMockMutation(),
}));

vi.mock("../queries/cotacao/useCotacaoQueries.js", () => ({
  COTACAO_QUERY_KEY: ["cotacao", "dolar"],
  COTACAO_EURO_QUERY_KEY: ["cotacao", "euro"],
  COTACAO_MERCADO_QUERY_KEY: ["cotacao", "mercado"],
  getCotacaoDolarQueryOptions: () => ({}),
  useCotacaoDolarQuery: () => createMockQuery({ valor: 5.5, fonte: "mock" }),
  getCotacaoEuroQueryOptions: () => ({}),
  useCotacaoEuroQuery: () => createMockQuery({ valor: 6.0, fonte: "mock" }),
  getCotacaoMercadoQueryOptions: () => ({}),
  useCotacaoMercadoQuery: () => createMockQuery({ dolar: 5.5, soja: 12, milho: 8 }),
}));

vi.mock("../queries/noticia/useNoticiasQueries.js", () => ({
  useNoticiasInfiniteQuery: () => createMockInfiniteQuery(),
  useNoticiasPreviewQuery: () => createMockQuery([]),
}));

vi.mock("../queries/usuario/useUsuarioQueries.js", () => ({
  useUsuarioListQuery: () => createMockQuery([]),
  useCreateUsuarioMutation: () => createMockMutation(),
  useUpdateUsuarioMutation: () => createMockMutation(),
  useDeleteUsuarioMutation: () => createMockMutation(),
}));

vi.mock("../queries/dashboard/useDashboardQueries.js", () => ({
  DASHBOARD_QUERY_KEY: ["dashboard"],
  getDashboardQueryOptions: () => ({}),
  useDashboardQuery: () =>
    createMockQuery({
      recomendacao: null,
      producaoPorCultura: [],
      sacasEmEstoque: [],
      extratoRecente: [],
      cards: { saldoTotal: 0, lucroTotal: 0, custosTotais: 0, cotacaoAtual: null },
    }),
}));

vi.mock("../queries/notificacao/useNotificacaoQueries.js", () => ({
  useNotificacoesQuery: () => createMockQuery([]),
  useMarcarNotificacaoComoLidaMutation: () => createMockMutation(),
  useMarcarTodasNotificacoesComoLidasMutation: () => createMockMutation(),
}));

import Login from "./Auth/Login.jsx";
import Fazendas from "./Fazendas/Fazendas.jsx";
import Gastos from "./Gastos/Gastos.jsx";
import Lucros from "./Lucros/Lucros.jsx";
import Estoque from "./Estoque/Estoque.jsx";
import Insumos from "./Insumos/Insumos.jsx";
import Lembretes from "./Lembretes/Lembretes.jsx";
import Simulacao from "./Simulacao/Simulacao.jsx";
import Insights from "./Insights/Insights.jsx";
import Chatbot from "./Chatbot/Chatbot.jsx";
import Noticias from "./Noticias/Noticias.jsx";
import GerenciarUsuarios from "./Usuarios/GerenciarUsuarios.jsx";
import Colheitas from "./Colheitas/Colheitas.jsx";
import Dashboard from "./Dashboard/Dashboard.jsx";

const PAGES = [
  { name: "Login", Component: Login, heading: "Bem-vindo de volta!", route: "/login" },
  { name: "Fazendas", Component: Fazendas, heading: "Fazendas", route: "/fazendas" },
  { name: "Gastos", Component: Gastos, heading: "Meus Gastos", route: "/gastos" },
  { name: "Lucros", Component: Lucros, heading: "Meus Lucros", route: "/lucros" },
  { name: "Estoque", Component: Estoque, heading: "Estoque de Sacas", route: "/estoque" },
  { name: "Insumos", Component: Insumos, heading: "Insumos", route: "/insumos" },
  { name: "Lembretes", Component: Lembretes, heading: "Lembretes", route: "/lembretes" },
  { name: "Simulacao", Component: Simulacao, heading: "Simulação", route: "/simulacao" },
  { name: "Insights", Component: Insights, heading: "Insights", route: "/insights" },
  { name: "Chatbot", Component: Chatbot, heading: "Assistente IA", route: "/chatbot" },
  { name: "Noticias", Component: Noticias, heading: "Notícias", route: "/noticias" },
  { name: "Usuarios", Component: GerenciarUsuarios, heading: "Gerenciar Usuários", route: "/usuarios" },
  { name: "Colheitas", Component: Colheitas, heading: "Minhas Colheitas", route: "/colheitas" },
  { name: "Dashboard", Component: Dashboard, testId: "dashboard-page", route: "/dashboard" },
];

describe("pages smoke", () => {
  beforeEach(() => {
    authState.token = null;
    authState.usuario = {
      id: "user-smoke-1",
      role: "ADMIN",
      nome: "Admin Smoke",
      email: "admin@smoke.test",
      fazendasVinculadas: [],
    };
    authState.fazendaSelecionada = "todas";
  });

  it.each(PAGES)("renders $name without throwing", ({ Component, heading, testId, route }) => {
    const { container } = renderWithProviders(<Component />, { route });

    expect(container).toBeTruthy();
    expect(container.firstChild).toBeTruthy();

    if (testId) {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    } else if (heading) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
  });
});
