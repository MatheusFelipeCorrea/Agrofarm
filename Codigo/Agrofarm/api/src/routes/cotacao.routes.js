import { Router } from "express";
import { cotacaoController } from "../controllers/cotacao.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/dolar", cotacaoController.getDolar);
router.get("/euro", cotacaoController.getEuro);
router.get("/mercado", cotacaoController.getPainelMercado);

export { router as cotacaoRoutes };
