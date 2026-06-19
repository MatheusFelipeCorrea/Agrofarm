import { api } from "../api.js";

export async function buscarDashboard(fazendaId = "todas") {
  const { data } = await api.get("/dashboard", {
    params: { fazendaId: fazendaId || "todas" },
  });

  return data;
}
