import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const dir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(dir, "..", ".env");
dotenv.config({ path: envPath, override: true });

function normalizarChave(valor) {
  return String(valor ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\s+/g, "");
}

function diag(raw) {
  const k = normalizarChave(raw);
  return {
    definida: k.length > 0,
    tamanho: k.length,
    prefixo: k.slice(0, 4) || null,
    sufixo: k.length >= 4 ? k.slice(-4) : null,
    pareceGoogle: k.startsWith("AIza"),
    tamanhoEsperadoGoogle: k.length >= 35 && k.length <= 45,
    temEspacoNoValorBruto: /\s/.test(String(raw ?? "")),
  };
}

const chatbotKey = normalizarChave(process.env.GEMINI_API_KEY_CHATBOT);
const insightsKey = normalizarChave(process.env.GEMINI_API_KEY_INSIGHTS);
const legadoKey = normalizarChave(process.env.GEMINI_API_KEY);

console.log("Arquivo .env:", envPath);
console.log(
  JSON.stringify(
    {
      chatbot: diag(process.env.GEMINI_API_KEY_CHATBOT),
      insights: diag(process.env.GEMINI_API_KEY_INSIGHTS),
      legado: diag(process.env.GEMINI_API_KEY),
    },
    null,
    2,
  ),
);

async function testar(chave, rotulo) {
  if (!chave) {
    console.log(`\n[${rotulo}] sem chave — pulando`);
    return;
  }
  const genAI = new GoogleGenerativeAI(chave);
  const modelos = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];
  for (const modelo of modelos) {
    try {
      const model = genAI.getGenerativeModel({ model: modelo });
      const result = await model.generateContent("Responda apenas: OK");
      const texto = result.response?.text()?.trim();
      console.log(`\n[${rotulo}] SUCESSO modelo=${modelo} resposta=${texto?.slice(0, 40)}`);
      return;
    } catch (err) {
      const msg = String(err?.message ?? err);
      let curto = "erro desconhecido";
      if (msg.includes("API_KEY_INVALID")) curto = "API_KEY_INVALID (chave errada)";
      else if (msg.includes("429")) curto = "429 cota esgotada neste modelo (tente outro)";
      else if (msg.includes("404")) curto = "404 modelo não disponível na sua conta";
      else curto = msg.slice(0, 100);
      console.log(`\n[${rotulo}] FALHA modelo=${modelo}: ${curto}`);
    }
  }
  console.log(`\n[${rotulo}] Nenhum modelo respondeu — verifique cota em https://aistudio.google.com`);
}

await testar(chatbotKey, "GEMINI_API_KEY_CHATBOT");
if (insightsKey && insightsKey !== chatbotKey) {
  await testar(insightsKey, "GEMINI_API_KEY_INSIGHTS");
}
if (legadoKey && legadoKey !== chatbotKey) {
  await testar(legadoKey, "GEMINI_API_KEY");
}
