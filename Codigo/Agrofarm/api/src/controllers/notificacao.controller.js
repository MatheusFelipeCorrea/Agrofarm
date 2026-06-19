import { notificacaoService } from "../services/notificacao.service.js";
import { notificacaoView } from "../views/notificacao.view.js";

async function listar(req, res, next) {
  try {
    const { items, unreadCount, unreadMarcaveis } = await notificacaoService.listarParaUsuario({
      usuario: req.usuario,
      limit: req.query.limit,
    });

    res.json({
      status: "success",
      data: {
        items: notificacaoView.renderMany(items),
        unreadCount,
        unreadMarcaveis,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function marcarComoLida(req, res, next) {
  try {
    await notificacaoService.marcarComoLida({
      usuario: req.usuario,
      notificacaoId: req.params.id,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function marcarTodasComoLidas(req, res, next) {
  try {
    const { marcadas } = await notificacaoService.marcarTodasComoLidas({
      usuario: req.usuario,
    });

    res.json({ status: "success", data: { marcadas } });
  } catch (error) {
    next(error);
  }
}

export const notificacaoController = {
  listar,
  marcarComoLida,
  marcarTodasComoLidas,
};
