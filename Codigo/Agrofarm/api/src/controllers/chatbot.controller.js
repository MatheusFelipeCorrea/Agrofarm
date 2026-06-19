import { chatbotService } from "../services/chatbot.service.js";

async function listarSessoes(req, res, next) {
  try {
    const { limite } = req.query;
    const data = await chatbotService.listarSessoes(req.usuario, limite);
    res.json({ status: "success", data });
  } catch (e) {
    next(e);
  }
}

async function listarMensagens(req, res, next) {
  try {
    const data = await chatbotService.listarMensagens(req.usuario, req.params.id);
    res.json({ status: "success", data });
  } catch (e) {
    next(e);
  }
}

async function resumo(req, res, next) {
  try {
    const data = await chatbotService.obterResumoDados(req.usuario);
    res.json({ status: "success", data });
  } catch (e) {
    next(e);
  }
}

async function consultasFactuais(req, res, next) {
  try {
    const data = chatbotService.listarConsultasFactuais();
    res.json({ status: "success", data });
  } catch (e) {
    next(e);
  }
}

async function enviar(req, res, next) {
  try {
    const data = await chatbotService.enviarMensagem(req.usuario, req.body);
    res.status(201).json({ status: "success", data });
  } catch (e) {
    next(e);
  }
}

async function renomearSessao(req, res, next) {
  try {
    const data = await chatbotService.renomearSessao(req.usuario, req.params.id, req.body.titulo);
    res.json({ status: "success", data });
  } catch (e) {
    next(e);
  }
}

async function excluirSessao(req, res, next) {
  try {
    await chatbotService.excluirSessao(req.usuario, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export const chatbotController = {
  resumo,
  consultasFactuais,
  listarSessoes,
  listarMensagens,
  renomearSessao,
  excluirSessao,
  enviar,
};
