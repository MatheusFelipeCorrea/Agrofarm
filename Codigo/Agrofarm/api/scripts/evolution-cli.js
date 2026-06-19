import axios from "axios";
import { env } from "../src/config/env.js";

function print(data) {
  process.stdout.write(`${data}\n`);
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

function validarEnvEvolution() {
  if (!env.EVOLUTION_ENABLED) {
    throw new Error(
      "Evolution API nao configurada. Preencha EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE no .env",
    );
  }
}

async function status() {
  validarEnvEvolution();
  const response = await axios.get(
    buildBaseUrl(`/instance/connectionState/${env.EVOLUTION_INSTANCE}`),
    { headers: buildHeaders() },
  );
  print(JSON.stringify(response.data, null, 2));
}

async function provisionar(numero) {
  validarEnvEvolution();

  const payload = {
    instanceName: env.EVOLUTION_INSTANCE,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
  };

  if (numero) {
    payload.number = String(numero).replace(/\D/g, "");
  }

  try {
    const createResponse = await axios.post(buildBaseUrl("/instance/create"), payload, {
      headers: buildHeaders(),
    });
    print("Instancia criada:");
    print(JSON.stringify(createResponse.data, null, 2));
  } catch (error) {
    if (error?.response?.status !== 403) {
      throw error;
    }
    print("Instancia ja existe, continuando para conexao...");
  }

  const connectResponse = await axios.get(
    buildBaseUrl(`/instance/connect/${env.EVOLUTION_INSTANCE}`),
    { headers: buildHeaders() },
  );

  print("Dados de conexao (QR/Pairing):");
  print(JSON.stringify(connectResponse.data, null, 2));
}

async function conectar() {
  validarEnvEvolution();
  const response = await axios.get(
    buildBaseUrl(`/instance/connect/${env.EVOLUTION_INSTANCE}`),
    { headers: buildHeaders() },
  );
  print(JSON.stringify(response.data, null, 2));
}

async function main() {
  const comando = process.argv[2];
  const numero = process.argv[3];

  switch (comando) {
    case "status":
      await status();
      break;
    case "provisionar":
      await provisionar(numero);
      break;
    case "conectar":
      await conectar();
      break;
    default:
      print("Uso:");
      print("  npm run evolution:status");
      print("  npm run evolution:provisionar -- 5531999999999");
      print("  npm run evolution:conectar");
  }
}

main().catch((error) => {
  const payload = {
    tipo: typeof error,
    status: error?.response?.status || null,
    data: error?.response?.data || null,
    message: error?.message || String(error),
  };
  process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(1);
});
