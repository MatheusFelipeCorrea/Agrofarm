import { env } from "./env.js";

const origensExplicitas = env.CORS_ORIGIN.split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

/**
 * Em desenvolvimento, o Vite costuma abrir como localhost ou 127.0.0.1 — são origens
 * diferentes para o navegador. Espelha as entradas de CORS_ORIGIN entre os dois hosts.
 */
function espelharLocalhost127(origens) {
  const conjunto = new Set(origens);
  for (const o of origens) {
    try {
      const url = new URL(o);
      if (url.hostname === "localhost") {
        url.hostname = "127.0.0.1";
        conjunto.add(url.toString());
      } else if (url.hostname === "127.0.0.1") {
        url.hostname = "localhost";
        conjunto.add(url.toString());
      }
    } catch {
      /* URL invalida na lista: ignora */
    }
  }
  return [...conjunto];
}

const origensPermitidas =
  env.NODE_ENV === "development"
    ? espelharLocalhost127(origensExplicitas)
    : origensExplicitas;

/** Em development, aceita qualquer porta em localhost / 127.0.0.1 (Vite troca de porta se ocupada). */
function isOrigemLoopbackDev(origin) {
  if (env.NODE_ENV !== "development") return false;
  try {
    const u = new URL(origin);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export const corsOptions = {
  origin(origin, callback) {
    if (!origin || origensPermitidas.includes(origin)) {
      callback(null, true);
      return;
    }
    if (isOrigemLoopbackDev(origin)) {
      callback(null, true);
      return;
    }

    /* false = sem cabecalhos CORS; evita Error nao tratado no Express */
    callback(null, false);
  },
  credentials: true,
};
