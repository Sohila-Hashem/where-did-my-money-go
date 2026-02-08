import { sentryVitePlugin } from "@sentry/vite-plugin";
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [devtools(), tanstackRouter({
    target: 'react',
    autoCodeSplitting: true,
  }), viteReact(), tailwindcss(), sentryVitePlugin({
    org: import.meta.env.SENTRY_ORG,
    project: import.meta.env.SENTRY_PROJECT
  })],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    exclude: ['node_modules', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
      exclude: [
        "node_modules/**",
        "dist/**",
        "docs/**",
        "coverage/**",
        "src/main.tsx",
        "src/components/ui/**",
        "src/components/theme-provider.tsx",
        "src/reportWebVitals.ts",
        "src/routeTree.gen.ts",
        "src/**/__root.tsx",
        "src/lib/constants.ts",
        "src/schemas/expense-schema.ts",
        "vite.config.ts",
        "playwright.config.ts"
      ]
    },
  },

  build: {
    sourcemap: true
  }
})