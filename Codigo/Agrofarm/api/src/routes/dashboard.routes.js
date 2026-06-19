import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { dashboardFiltroSchema } from "../schemas/dashboard.schema.js";

const router = Router();

router.use(authMiddleware);

router.get("/", validate(dashboardFiltroSchema), dashboardController.getDados);

export { router as dashboardRoutes };