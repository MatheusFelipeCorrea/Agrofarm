import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { chatbotRoutes } from "./chatbot.routes.js";
import { colheitaRoutes } from "./colheita.routes.js";
import { cotacaoRoutes } from "./cotacao.routes.js";
import { culturaRoutes } from "./cultura.routes.js";
import { dashboardRoutes } from "./dashboard.routes.js";
import { fazendaRoutes } from "./fazenda.routes.js";
import { gastoRoutes } from "./gasto.routes.js";
import { lembreteRoutes } from "./lembrete.routes.js";
import { lucroRoutes } from "./lucro.routes.js";
import { estoqueRoutes } from "./estoque.routes.js";
import { insumoRoutes } from "./insumo.routes.js";
import { notificacaoRoutes } from "./notificacao.routes.js";
import { poligonoRoutes } from "./poligono.routes.js";
import { simulacaoRoutes } from "./simulacao.routes.js";
import { iaRoutes } from "./ia.routes.js";
import { noticiaRoutes } from "./noticia.routes.js";
import { usuarioRoutes } from "./usuario.routes.js";

export const router = Router()

router.get('/health', (_req, res) => {
  res.json({
    status: 'success',
    message: 'API Agrofarm em execucao',
  })
})

router.use("/auth", authRoutes);
router.use("/chatbot", chatbotRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/cotacao", cotacaoRoutes);
router.use("/fazendas", fazendaRoutes);
router.use("/culturas", culturaRoutes);
router.use("/lembretes", lembreteRoutes);
router.use("/colheitas", colheitaRoutes);
router.use("/gastos", gastoRoutes);
router.use("/lucros", lucroRoutes);
router.use("/estoque", estoqueRoutes);
router.use("/insumos", insumoRoutes);
router.use("/notificacoes", notificacaoRoutes);
router.use("/poligonos", poligonoRoutes);
router.use("/simulacao", simulacaoRoutes);
router.use("/ia", iaRoutes);
router.use("/noticias", noticiaRoutes);
