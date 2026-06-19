import { lembreteService } from "../services/lembrete.service.js";
import { whatsappService } from "../services/whatsapp.service.js";
import { lembreteView } from "../views/lembrete.view.js";

async function listar(req, res, next) {
  try {
    const filtros = req.query;
    const usuario = req.usuario;

    const lembretes = await lembreteService.listarTodos({
      ...filtros,
      usuario,
    });

    res.json({
      status: "success",
      data: lembreteView.renderMany(lembretes),
    });
  } catch (error) {
    next(error);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const lembrete = await lembreteService.buscarPorId(req.params.id);
    res.json({
      status: "success",
      data: lembreteView.render(lembrete),
    });
  } catch (error) {
    next(error);
  }
}
async function criar(req, res, next) {
  try {
    const usuario = req.usuario;

    const lembrete = await lembreteService.criar({
      ...req.body,
      usuarioId: usuario.id,
      usuario,
    });

    res.status(201).json({
      status: "success",
      data: lembreteView.render(lembrete),
    });
  } catch (error) {
    next(error);
  }
}

async function atualizar(req, res, next) {
  try {
    const lembrete = await lembreteService.atualizar(req.params.id, req.body);
    res.json({
      status: "success",
      data: lembreteView.render(lembrete),
    });
  } catch (error) {
    next(error);
  }
}

async function remover(req, res, next) {
  try {
    await lembreteService.remover(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function enviarAgora(req, res, next) {
  try {
    const lembrete = await lembreteService.enviarLembrete(req.params.id);
    res.json({
      status: "success",
      data: lembreteView.render(lembrete),
    });
  } catch (error) {
    next(error);
  }
}

async function statusWhatsapp(_req, res, next) {
  try {
    const status = await whatsappService.statusConfiguracao();
    res.json({
      status: "success",
      data: status,
    });
  } catch (error) {
    next(error);
  }
}

async function provisionarWhatsapp(req, res, next) {
  try {
    const resultado = await whatsappService.provisionarInstancia({
      numero: req.body?.numero,
    });

    res.status(201).json({
      status: "success",
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
}

async function getCalendario(req, res, next) {
  try {
    const { mes, ano, fazendaId, status } = req.query;
    const usuario = req.usuario;

    const result = await lembreteService.getCalendario({
      mes: Number(mes),
      ano: Number(ano),
      fazendaId,
      status,
      usuario,
    });

    res.json({
      status: "success",
      data: result,
    });
  } catch (e) {
    next(e);
  }
}

async function getDia(req, res, next) {
  try {
    const { data, status, fazendaId } = req.query;
    const usuario = req.usuario;

    const result = await lembreteService.getDia({
      data,
      status,
      fazendaId,
      usuario,
    });

    res.json({
      status: "success",
      data: lembreteView.renderMany(result),
    });
  } catch (e) {
    next(e);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;

    const result = await lembreteService.updateStatus(
      req.params.id,
      status
    );

    res.json({
      status: "success",
      data: lembreteView.render(result),
    });
  } catch (e) {
    next(e);
  }
}

async function deleteAll(req, res) {
  if (req.query.confirm !== "true") {
    return res.status(400).json({
      message: "Confirmação necessária para remover todos",
    });
  }

  const resultado = await lembreteService.removerTodos({
    usuario: req.usuario,
  });

  return res.status(200).json(resultado);
}

export const lembreteController = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  remover,
  enviarAgora,
  statusWhatsapp,
  provisionarWhatsapp,
  getCalendario,
  getDia,
  updateStatus,
  deleteAll,
};
