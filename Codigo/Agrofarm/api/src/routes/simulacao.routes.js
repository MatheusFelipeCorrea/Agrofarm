import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { simulacaoController } from "../controllers/simulacao.controller.js";
import { idSchema } from "../schemas/common.schema.js";
import { calcularSacasSchema, salvarSimulacaoSchema, simulacaoDividasQuerySchema } from "../schemas/simulacao.schema.js";

const router = Router();

router.use(authMiddleware);
router.use(authorize("ADMIN"));

router.get("/dividas", validate({ query: simulacaoDividasQuerySchema }), simulacaoController.buscarDividas);
router.get("/historico", validate({ query: simulacaoDividasQuerySchema }), simulacaoController.buscarHistorico);
router.post("/calcular-sacas", validate({ body: calcularSacasSchema }), simulacaoController.calcularSacas);
router.post("/salvar", validate({ body: salvarSimulacaoSchema }), simulacaoController.salvarSimulacao);
router.delete("/:id", validate({ params: idSchema }), simulacaoController.excluirSimulacao);

export { router as simulacaoRoutes };
