import { noticiaService } from "../services/noticia.service.js";
import { noticiaView } from "../views/noticia.view.js";

async function listar(req, res, next) {
  try {
    const resultado = await noticiaService.listar({
      categoria: req.query.categoria,
      busca: req.query.busca,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    res.json({
      status: "success",
      data: noticiaView.renderListagem(resultado),
    });
  } catch (error) {
    next(error);
  }
}

export const noticiaController = {
  listar,
};
