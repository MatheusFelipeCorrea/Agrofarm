import axios from "axios";
import { env } from "../config/env.js";
import { AppError } from "../shared/errors/AppError.js";
import { logger } from "../shared/utils/logger.js";

function validarConfiguracao() {
  if (!env.EVOLUTION_ENABLED) {
    throw new AppError(
      "Evolution API nao configurada. Verifique EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE.",
      503,
    );
  }
}

function normalizarTelefone(numero) {
  const apenasDigitos = String(numero).replace(/\D/g, "");

  if (apenasDigitos.length < 10) {
    throw new AppError("Telefone de WhatsApp invalido", 400);
  }

  return apenasDigitos;
}

function buildHeaders() {
  return {
    apikey: env.EVOLUTION_API_KEY,
    "Content-Type": "application/json",
  };
}

function buildBaseUrl(path = "") {
  return `${env.EVOLUTION_API_URL}${path}`;
}

async function requestEvolution({ method, path, data, timeout = 10000 }) {
  try {
    const response = await axios({
      method,
      url: buildBaseUrl(path),
      headers: buildHeaders(),
      data,
      timeout,
    });

    return response.data;
  } catch (error) {
    const detalhesErro = error?.response?.data || error?.message || "Sem resposta da Evolution API";
    logger.error(
      {
        erro: detalhesErro,
        status: error?.response?.status,
        path,
      },
      "Falha na comunicacao com Evolution API",
    );
    throw error;
  }
}

async function enviarTexto({ numero, texto }) {
  validarConfiguracao();

  const number = normalizarTelefone(numero);

  try {
    return await requestEvolution({
      method: "post",
      path: `/message/sendText/${env.EVOLUTION_INSTANCE}`,
      data: {
        number,
        text: texto,
      },
    });
  } catch {
    throw new AppError("Falha ao enviar mensagem no WhatsApp", 502);
  }
}

async function obterEstadoConexao() {
  validarConfiguracao();

  try {
    const data = await requestEvolution({
      method: "get",
      path: `/instance/connectionState/${env.EVOLUTION_INSTANCE}`,
      timeout: 5000,
    });

    return {
      apiOnline: true,
      instance: data?.instance?.instanceName || env.EVOLUTION_INSTANCE,
      state: data?.instance?.state || "desconhecido",
    };
  } catch (error) {
    if (error?.response?.status === 404) {
      return {
        apiOnline: true,
        instance: env.EVOLUTION_INSTANCE,
        state: "nao_encontrada",
      };
    }

    return {
      apiOnline: false,
      instance: env.EVOLUTION_INSTANCE,
      state: "erro_comunicacao",
      detalhes:
        error?.response?.data || error?.message || "Sem resposta da Evolution API",
    };
  }
}

async function provisionarInstancia({ numero } = {}) {
  validarConfiguracao();

  const payload = {
    instanceName: env.EVOLUTION_INSTANCE,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
  };

  if (numero) {
    payload.number = normalizarTelefone(numero);
  }

  let createResult = null;

  try {
    createResult = await requestEvolution({
      method: "post",
      path: "/instance/create",
      data: payload,
      timeout: 15000,
    });
  } catch (error) {
    if (error?.response?.status !== 403) {
      throw new AppError("Falha ao criar instancia na Evolution API", 502);
    }
  }

  try {
    const connectResult = await requestEvolution({
      method: "get",
      path: `/instance/connect/${env.EVOLUTION_INSTANCE}`,
      timeout: 15000,
    });

    return {
      instance: env.EVOLUTION_INSTANCE,
      criadaAgora: Boolean(createResult),
      connect: connectResult,
    };
  } catch {
    throw new AppError("Falha ao iniciar conexao (QR Code) da instancia", 502);
  }
}

async function statusConfiguracao() {
  const configurado = env.EVOLUTION_ENABLED;

  if (!configurado) {
    return {
      configurado,
      instance: env.EVOLUTION_INSTANCE || null,
      url: env.EVOLUTION_API_URL || null,
      conexao: {
        apiOnline: false,
        state: "nao_configurado",
      },
    };
  }

  const conexao = await obterEstadoConexao();

  return {
    configurado,
    instance: env.EVOLUTION_INSTANCE || null,
    url: env.EVOLUTION_API_URL || null,
    conexao,
  };
}

export const whatsappService = {
  enviarTexto,
  obterEstadoConexao,
  provisionarInstancia,
  statusConfiguracao,
};
