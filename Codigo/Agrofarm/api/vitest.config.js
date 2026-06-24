import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/tests/**/*.spec.js"],
    setupFiles: ["src/tests/vitest.setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      include: ["src/**/*.js"],
      exclude: [
        "src/tests/**",
        "**/*.spec.js",
        "src/database/seeds/**",
        "src/server.js",
        "src/scripts/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
