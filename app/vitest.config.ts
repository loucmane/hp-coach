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
    // The pre-push hook runs the full suite on a shared host; under heavy
    // load (load average 40+) lazy-screen tests exceeded the 5 s default.
    testTimeout: 15_000,
    // Host rule (2026-11-04): the 32 cores are shared by up to three
    // workers per project, so no test runner uses more than 8 workers.
    maxWorkers: 8,
  },
})
