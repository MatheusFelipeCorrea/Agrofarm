import { colheitaService } from "../services/colheita.service.js";
import { colheitaView } from "../views/colheita.view.js";

async function listar(req, res, next) {
  try {
    const usuarioId = req.usuario?.id;
    const colheitas = await colheitaService.listar({
      usuarioId,
      role: req.usuario?.role,
      fazendaId: req.query?.fazendaId,
      culturaId: req.query?.culturaId,
      mes: req.query?.mes,
      ano: req.query?.ano,
      from: req.query?.from,
      to: req.query?.to,
    });
    res.json({
      status: "success",
      data: colheitaView.renderMany(colheitas),
    });
  } catch (error) {
    next(error);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const usuarioId = req.usuario?.id;
    const colheita = await colheitaService.buscarPorId({
      usuarioId,
      role: req.usuario?.role,
      id: req.params.id,
    });
    res.json({
      status: "success",
      data: colheitaView.render(colheita),
    });
  } catch (error) {
    next(error);
  }
}

async function buscarPorFazenda(req, res, next) {
  try {
    const usuarioId = req.usuario?.id;
    const colheitas = await colheitaService.buscarPorFazenda({
      usuarioId,
      role: req.usuario?.role,
      fazendaId: req.params.fazendaId,
    });

    res.json({
      status: "success",
      data: colheitaView.renderMany(colheitas),
    });
  } catch (error) {
    next(error);
  }
}

async function criar(req, res, next) {
  try {
    const usuarioId = req.usuario?.id;
    const colheita = await colheitaService.criar({
      usuarioId,
      role: req.usuario?.role,
      payload: req.body,
    });
    res.status(201).json({
      status: "success",
      data: colheitaView.render(colheita),
    });
  } catch (error) {
    next(error);
  }
}

async function atualizar(req, res, next) {
  try {
    const usuarioId = req.usuario?.id;
    const colheita = await colheitaService.atualizar({
      usuarioId,
      role: req.usuario?.role,
      id: req.params.id,
      payload: req.body,
    });
    res.json({
      status: "success",
      data: colheitaView.render(colheita),
    });
  } catch (error) {
    next(error);
  }
}

async function remover(req, res, next) {
  try {
    const usuarioId = req.usuario?.id;
    await colheitaService.remover({
      usuarioId,
      role: req.usuario?.role,
      id: req.params.id,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export const colheitaController = {
  listar,
  buscarPorId,
  buscarPorFazenda,
  criar,
  atualizar,
  remover,
};

