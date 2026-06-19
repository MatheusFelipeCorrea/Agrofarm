import { AppError } from "../shared/errors/AppError.js";
import { insightsService } from "../services/insights.service.js";
import { insightsView } from "../views/insights.view.js";

function assertAdmin(req) {
  if (req.usuario?.role !== "ADMIN") {
    throw new AppError("Acesso restrito a administradores", 403);
  }
}

export const insightsController = {
  getInsights: async (req, res, next) => {
    try {
      assertAdmin(req);
      const painel = await insightsService.buscarInsights({
        usuario: req.usuario,
        fazendaId: req.query.fazendaId,
      });
      res.json({ status: "success", data: insightsView.renderPainel(painel) });
    } catch (error) {
      next(error);
    }
  },

  refreshInsight: async (req, res, next) => {
    try {
      assertAdmin(req);
      const resultado = await insightsService.refreshInsight({
        usuario: req.usuario,
        tipo: req.body.tipo,
        fazendaId: req.body.fazendaId,
        fazendaCarouselId: req.body.fazendaCarouselId,
      });
      res.json({ status: "success", data: insightsView.renderRefresh(resultado) });
    } catch (error) {
      next(error);
    }
  },
};
