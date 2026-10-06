/// <reference types="vitest" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Dedicated Vitest config — keeps the production Vite config clean.
// `vitest run` reads this; `vite dev/build` continues to read vite.config.ts.
export default defineConfig({
  plugins: [
    react(),
    {
      // Let entrypoint tests mock the PWA module without starting a SW.
      name: 'test-pwa-register',
      resolveId(id) {
        if (id === 'virtual:pwa-register') return id
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Keep e2e Playwright specs out of Vitest's collector.
    exclude: ['node_modules', 'dist', 'tests-e2e/**'],
    css: false,
  },
})
