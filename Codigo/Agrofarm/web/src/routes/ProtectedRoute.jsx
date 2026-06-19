import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { getFirstAllowedPath, isPathAllowed } from "./routeAccess.js";

export function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  const menu = useAuthStore((s) => s.menu);
  const { pathname } = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!isPathAllowed(pathname, menu)) {
    return <Navigate to={getFirstAllowedPath(menu)} replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.usuario?.role);
  const menu = useAuthStore((s) => s.menu);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (role !== "ADMIN") {
    return <Navigate to={getFirstAllowedPath(menu)} replace />;
  }
  return children;
}

export function FuncionarioRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.usuario?.role);
  const menu = useAuthStore((s) => s.menu);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (role !== "FUNCIONARIO") {
    return <Navigate to={getFirstAllowedPath(menu)} replace />;
  }
  return children;
}

export function PublicRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  const menu = useAuthStore((s) => s.menu);

  if (token) {
    return <Navigate to={getFirstAllowedPath(menu)} replace />;
  }

  return children;
}
