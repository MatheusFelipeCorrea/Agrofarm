import { api } from "../api.js";

export async function buscarInsights(fazendaId = "todas") {
  const { data } = await api.get("/ia/insights", {
    params: { fazendaId: fazendaId || "todas" },
  });
  return data.data;
}

export async function atualizarInsight({ tipo, fazendaId = "todas", fazendaCarouselId }) {
  const body = {
    tipo,
    fazendaId: fazendaId || "todas",
  };
  if (fazendaCarouselId) body.fazendaCarouselId = fazendaCarouselId;

  const { data } = await api.post("/ia/insights/refresh", body);
  return data.data;
}
