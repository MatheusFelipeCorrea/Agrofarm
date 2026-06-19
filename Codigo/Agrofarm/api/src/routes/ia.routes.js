import { Router } from "express";
import { insightsController } from "../controllers/insights.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validator } from "../middlewares/validator.middleware.js";
import { insightsQuerySchema, refreshInsightSchema } from "../schemas/insights.schema.js";

const router = Router();

router.use(authMiddleware);

router.get("/insights", validator({ query: insightsQuerySchema }), insightsController.getInsights);
router.post("/insights/refresh", validator({ body: refreshInsightSchema }), insightsController.refreshInsight);

export { router as iaRoutes };
