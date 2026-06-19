import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useAuthStore } from "./store/authStore.js";
import Login from "./pages/Auth/Login.jsx";
import Chatbot from "./pages/Chatbot/Chatbot.jsx";
import Gastos from "./pages/Gastos/Gastos.jsx";
import Fazendas from "./pages/Fazendas/Fazendas.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import FazendaDetalhe from "./pages/Fazendas/FazendaDetalhe.jsx";
import GerenciarUsuarios from "./pages/Usuarios/GerenciarUsuarios.jsx";
import Colheitas from "./pages/Colheitas/Colheitas.jsx";
import Lucros from "./pages/Lucros/Lucros.jsx";
import Estoque from "./pages/Estoque/Estoque.jsx";
import Insumos from "./pages/Insumos/Insumos.jsx";
import { AdminRoute, PrivateRoute, PublicRoute } from "./routes/ProtectedRoute.jsx";
import { getFirstAllowedPath } from "./routes/routeAccess.js";
import RedefinirSenha from "./pages/Auth/RedefinirSenha/RedefinirSenha.jsx";
import RecuperarSenha from "./pages/Auth/RecuperarSenha/RecuperarSenha.jsx";
import TrocarSenhaInicial from "./pages/Auth/TrocarSenhaInicial/TrocarSenhaInicial.jsx";
import Lembretes from "./pages/Lembretes/Lembretes.jsx";
import Simulacao from "./pages/Simulacao/Simulacao.jsx";
import Insights from "./pages/Insights/Insights.jsx";
import Noticias from "./pages/Noticias/Noticias.jsx";
import { useSessionQuery } from "./queries/auth/useSessionQuery.js";
import FloatingChatFab from "./components/shared/FloatingChatFab.jsx";

function PageProgressBar() {
  const { pathname } = useLocation();
  const [bar, setBar] = useState({ width: 0, opacity: 0 });
  const timers = useRef([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const schedule = (fn, delay) => {
      const id = setTimeout(fn, delay);
      timers.current.push(id);
    };

    schedule(() => setBar({ width: 0, opacity: 1 }), 0);
    schedule(() => setBar({ width: 72, opacity: 1 }), 30);
    schedule(() => setBar({ width: 91, opacity: 1 }), 260);
    schedule(() => setBar({ width: 100, opacity: 1 }), 460);
    schedule(() => setBar({ width: 100, opacity: 0 }), 580);

    return () => timers.current.forEach(clearTimeout);
  }, [pathname]);

  return (
    <div
      aria-hidden
      style={{
        width: `${bar.width}%`,
        opacity: bar.opacity,
        transition:
          bar.width === 0
            ? "none"
            : "width 280ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease-in",
      }}
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[3px] bg-[var(--agro-accent-lime)] shadow-[0_0_6px_rgba(159,232,112,0.55)]"
    />
  );
}

function App() {
  const token = useAuthStore((s) => s.token);
  const menu = useAuthStore((s) => s.menu);

  useSessionQuery();

  const fallbackRoute = token ? getFirstAllowedPath(menu) : "/login";

  return (
    <BrowserRouter>
      <PageProgressBar />
      <FloatingChatFab />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/recuperar-senha"
          element={
            <PublicRoute>
              <RecuperarSenha />
            </PublicRoute>
          }
        />
        <Route
          path="/lembretes"
          element={
            <PrivateRoute>
              <Lembretes />
            </PrivateRoute>
          }
        />
        <Route
          path="/redefinir-senha"
          element={
            <PublicRoute>
              <RedefinirSenha />
            </PublicRoute>
          }
        />
        <Route
          path="/trocar-senha-inicial"
          element={
            <PublicRoute>
              <TrocarSenhaInicial />
            </PublicRoute>
          }
        />
        <Route
          path="/simulacao"
          element={
            <AdminRoute>
              <Simulacao />
            </AdminRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <AdminRoute>
              <Insights />
            </AdminRoute>
          }
        />
        <Route
          path="/noticias"
          element={
            <PrivateRoute>
              <Noticias />
            </PrivateRoute>
          }
        />
        <Route path="/insights-inteligentes" element={<Navigate to="/insights" replace />} />
        <Route
          path="/chatbot"
          element={
            <PrivateRoute>
              <Chatbot />
            </PrivateRoute>
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/gastos"
          element={
            <PrivateRoute>
              <Gastos />
            </PrivateRoute>
          }
        />
        <Route
          path="/colheitas"
          element={
            <PrivateRoute>
              <Colheitas />
            </PrivateRoute>
          }
        />
        <Route
          path="/fazendas"
          element={
            <PrivateRoute>
              <Fazendas />
            </PrivateRoute>
          }
        />
        <Route
          path="/fazendas/:id"
          element={
            <PrivateRoute>
              <FazendaDetalhe />
            </PrivateRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <AdminRoute>
              <GerenciarUsuarios />
            </AdminRoute>
          }
        />
        <Route
          path="/lucros"
          element={
            <PrivateRoute>
              <Lucros />
            </PrivateRoute>
          }
        />
        <Route
          path="/estoque"
          element={
            <PrivateRoute>
              <Estoque />
            </PrivateRoute>
          }
        />
        <Route
          path="/insumos"
          element={
            <PrivateRoute>
              <Insumos />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to={fallbackRoute} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
