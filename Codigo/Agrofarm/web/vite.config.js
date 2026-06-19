/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.spec.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/utils/**/*.js',
        'src/lib/mutationProps.js',
        'src/lib/utils.js',
        'src/store/slices/**/*.js',
        'src/services/**/*.js',
        'src/components/**/*.js',
        'src/routes/routeAccess.js',
      ],
      exclude: [
        '**/*.spec.{js,jsx}',
        '**/index.js',
        '**/index.jsx',
        'src/services/api.js',
        'src/lib/queryClient.js',
        'src/lib/notify.js',
        'src/utils/masks.js',
        'src/services/chatbot/**',
        'src/services/estoque/**',
        'src/services/simulacao/**',
        'src/services/ia/**',
        'src/components/usuarios/usuariosConstants.js',
        'src/store/slices/uiSlice.js',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
})
