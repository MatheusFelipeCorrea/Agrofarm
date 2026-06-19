import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore.js";
import { isAuthPublicPath } from "../../routes/routeAccess.js";
import { obterSessaoAtual } from "../../services/auth/auth.service.js";

const SESSION_QUERY_KEY = ["auth", "session"];

export function useSessionQuery() {
  const token = useAuthStore((s) => s.token);
  const hydrateSession = useAuthStore((s) => s.hydrateSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  const pathname = window.location.pathname;
  const emRotaPublica = isAuthPublicPath(pathname);

  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: obterSessaoAtual,
    enabled: Boolean(token) && !emRotaPublica,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (query.data) {
      hydrateSession({ usuario: query.data.usuario, menu: query.data.menu });
    }
  }, [query.data, hydrateSession]);

  useEffect(() => {
    if (query.isError) {
      clearSession();
    }
  }, [query.isError, clearSession]);

  return query;
}
