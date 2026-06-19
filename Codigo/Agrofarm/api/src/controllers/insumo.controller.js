import { insumoService } from "../services/insumo.service.js";
import { insumoView } from "../views/insumo.view.js";

async function listar(req, res, next) {
  try {
    const result = await insumoService.listar({
      usuarioId: req.usuario.id,
      role: req.usuario.role,
      query: req.query,
    });

    const mediaPorDia = insumoView.mediaDiaria(result.totals.totalConsumo, req.query.from, req.query.to);

    res.json({
      status: "success",
      data: {
        items: insumoView.renderMany(result.items),
        totals: {
          ...result.totals,
          mediaPorDia,
        },
        meta: result.meta,
        itensDisponiveis: result.itensDisponiveis,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function criar(req, res, next) {
  try {
    const row = await insumoService.criar({
      usuarioId: req.usuario.id,
      role: req.usuario.role,
      payload: req.body,
    });
    res.status(201).json({
      status: "success",
      data: insumoView.render(row),
    });
  } catch (error) {
    next(error);
  }
}

async function atualizar(req, res, next) {
  try {
    const row = await insumoService.atualizar({
      usuarioId: req.usuario.id,
      role: req.usuario.role,
      id: req.params.id,
      payload: req.body,
    });
    res.json({
      status: "success",
      data: insumoView.render(row),
    });
  } catch (error) {
    next(error);
  }
}

async function remover(req, res, next) {
  try {
    await insumoService.remover({
      usuarioId: req.usuario.id,
      role: req.usuario.role,
      id: req.params.id,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export const insumoController = {
  listar,
  criar,
  atualizar,
  remover,
};
