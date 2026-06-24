import { gastoService } from "../services/gasto.service.js";
import { gastoView } from "../views/gasto.view.js";

async function getAll(req, res, next) {
  try {
    const usuarioId = req.usuario?.id;

    const result = await gastoService.getAll({
      usuarioId,
      role: req.usuario?.role,
      query: req.query,
    });

    res.json({
      status: "success",
      data: {
        items: result.items.map((item) => gastoView.render(item)),
        totals: gastoView.renderResumo(result.totals),
        meta: result.meta,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getResumo(req, res, next) {
  try {
    const usuarioId = req.usuario?.id;
    const resumo = await gastoService.getResumo({
      usuarioId,
      role: req.usuario?.role,
      query: req.query,
    });

    res.json({
      status: "success",
      data: gastoView.renderResumo(resumo),
    });
  } catch (error) {
    next(error);
  }
}

async function getPorColheita(req, res, next) {
  try {
    const usuarioId = req.usuario?.id;
    const result = await gastoService.getPorColheita({
      usuarioId,
      role: req.usuario?.role,
      colheitaId: req.params.colheitaId,
      query: req.query,
    });

    res.json({
      status: "success",
      data: {
        items: gastoView.renderMany(result.items),
        totals: result.totals,
        meta: result.meta,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const usuarioId = req.usuario?.id;
    const gasto = await gastoService.create({ usuarioId, role: req.usuario?.role, payload: req.body });
    res.status(201).json({
      status: "success",
      data: gastoView.render(gasto),
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const usuarioId = req.usuario?.id;
    const gasto = await gastoService.update({
      usuarioId,
      role: req.usuario?.role,
      id: req.params.id,
      payload: req.body,
    });
    res.json({
      status: "success",
      data: gastoView.render(gasto),
    });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const usuarioId = req.usuario?.id;
    await gastoService.delete({ usuarioId, role: req.usuario?.role, id: req.params.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export const gastoController = {
  getAll,
  getResumo,
  getPorColheita,
  create,
  update,
  delete: remove,
  listar: getAll,
  criar: create,
  atualizar: update,
  remover: remove,
};
