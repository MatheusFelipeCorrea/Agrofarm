import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/tests/**/*.spec.js"],
    setupFiles: ["src/tests/vitest.setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "src/services/**/*.js",
        "src/schemas/**/*.js",
        "src/shared/**/*.js",
        "src/views/**/*.js",
      ],
      exclude: [
        "src/tests/**",
        "**/*.spec.js",
        "src/services/chatbot*.js",
        "src/services/whatsapp.service.js",
        "src/services/ia.service.js",
        "src/services/lembrete.service.js",
        "src/services/poligono.service.js",
        "src/services/cotacao.service.js",
        "src/views/chatbot.view.js",
        "src/shared/utils/bcrypt.js",
        "src/shared/utils/email.js",
        "src/shared/utils/jwt.js",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 55,
        statements: 80,
      },
    },
  },
});
