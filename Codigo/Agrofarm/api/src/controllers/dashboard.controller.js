import { dashboardService } from "../services/dashboard.service.js";

export const dashboardController = {
  getDados: async (req, res, next) => {
    try {
      const dashboard = await dashboardService.obterDados({
        usuario: req.usuario,
        filtro: req.query,
      });

      return res.status(200).json(dashboard);
    } catch (error) {
      next(error);
    }
  },
};