import { vi } from "vitest";

/** Default Prisma delegate methods used across repository tests. */
export const COMMON_DELEGATE_METHODS = [
  "findMany",
  "findUnique",
  "findFirst",
  "create",
  "update",
  "delete",
  "count",
  "aggregate",
  "groupBy",
  "deleteMany",
];

/**
 * Creates a mock Prisma model delegate with vi.fn() for each method.
 * @param {...string} methods
 */
export function mockModel(...methods) {
  const list = methods.length ? methods : COMMON_DELEGATE_METHODS;
  return Object.fromEntries(list.map((method) => [method, vi.fn()]));
}

/**
 * Builds the object passed to vi.mock('../../database/client.js', () => ...).
 * @param {Record<string, Record<string, import('vitest').Mock>>} models
 */
export function createPrismaMock(models = {}) {
  return { prisma: models };
}
