import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    NODE_ENV: "development",
    CORS_ORIGIN: "http://localhost:5173,http://127.0.0.1:3000",
  },
}));

vi.mock("../../config/env.js", () => ({
  env: mockEnv,
}));

import { corsOptions } from "../../config/cors.js";

function avaliarOrigem(origin) {
  return new Promise((resolve) => {
    corsOptions.origin(origin, (err, allowed) => {
      resolve({ err, allowed });
    });
  });
}

describe("corsOptions", () => {
  beforeEach(() => {
    mockEnv.NODE_ENV = "development";
    mockEnv.CORS_ORIGIN = "http://localhost:5173,http://127.0.0.1:3000";
  });

  it("permite origem ausente (same-origin / ferramentas)", async () => {
    const { allowed } = await avaliarOrigem(undefined);
    expect(allowed).toBe(true);
  });

  it("permite origens explicitas da lista", async () => {
    const { allowed } = await avaliarOrigem("http://localhost:5173");
    expect(allowed).toBe(true);
  });

  it("espelha localhost e 127.0.0.1 em development", async () => {
    const { allowed } = await avaliarOrigem("http://127.0.0.1:5173");
    expect(allowed).toBe(true);
  });

  it("aceita qualquer porta loopback em development", async () => {
    const { allowed } = await avaliarOrigem("http://localhost:4173");
    expect(allowed).toBe(true);
  });

  it("rejeita origem nao permitida", async () => {
    const { allowed } = await avaliarOrigem("https://evil.example.com");
    expect(allowed).toBe(false);
  });

  it("em producao nao aceita loopback generico fora da lista", async () => {
    mockEnv.NODE_ENV = "production";
    mockEnv.CORS_ORIGIN = "https://app.agrofarm.com";

    vi.resetModules();
    const { corsOptions: corsProd } = await import("../../config/cors.js");

    const resultado = await new Promise((resolve) => {
      corsProd.origin("http://localhost:9999", (_, allowed) => resolve(allowed));
    });
    expect(resultado).toBe(false);
  });

  it("expoe credentials true", () => {
    expect(corsOptions.credentials).toBe(true);
  });
});
