import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validator } from "../middlewares/validator.middleware.js";
import { noticiaController } from "../controllers/noticia.controller.js";
import { listarNoticiasQuerySchema } from "../schemas/noticia.schema.js";

export const noticiaRoutes = Router();

noticiaRoutes.get(
  "/",
  authMiddleware,
  validator({ query: listarNoticiasQuerySchema }),
  noticiaController.listar,
);
