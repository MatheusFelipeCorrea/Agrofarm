import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { listarNoticias } from "../../services/noticia/noticia.service.js";

const NOTICIAS_KEY = ["noticias"];

export function useNoticiasInfiniteQuery({ categoria = "TODAS", busca = "", pageSize = 8 } = {}) {
  const buscaNorm = String(busca ?? "").trim();

  return useInfiniteQuery({
    queryKey: [...NOTICIAS_KEY, categoria, buscaNorm, pageSize],
    queryFn: ({ pageParam = 1 }) =>
      listarNoticias({
        categoria,
        busca: buscaNorm || undefined,
        page: pageParam,
        pageSize,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage?.meta ?? {};
      if (page != null && totalPages != null && page < totalPages) {
        return page + 1;
      }
      return undefined;
    },
    staleTime: 8 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useNoticiasPreviewQuery() {
  return useQuery({
    queryKey: [...NOTICIAS_KEY, "preview"],
    queryFn: () => listarNoticias({ page: 1, pageSize: 4 }),
    staleTime: 10 * 60 * 1000,
  });
}
