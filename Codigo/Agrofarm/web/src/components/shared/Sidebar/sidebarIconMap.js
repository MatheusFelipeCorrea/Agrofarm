import {
  IconBox,
  IconChart,
  IconDashboard,
  IconFarm,
  IconHarvest,
  IconInsumos,
  IconInsights,
  IconChat,
  IconSimulacao,
  IconNoticias,
  IconLogout,
  IconMoney,
  IconReminder,
  IconUsers,
} from "./sidebarIcons.jsx";

export const ICON_MAP = {
  dashboard: IconDashboard,
  fazendas: IconFarm,
  gastos: IconMoney,
  lucros: IconChart,
  estoque: IconBox,
  colheitas: IconHarvest,
  insumos: IconInsumos,
  usuarios: IconUsers,
  lembretes: IconReminder,
  insights: IconInsights,
  simulacao: IconSimulacao,
  chat: IconChat,
  noticias: IconNoticias,
  logout: IconLogout,
};

export function getSidebarIcon(iconName) {
  return ICON_MAP[iconName] ?? IconFarm;
}

