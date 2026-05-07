/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Dedicated Vitest config — keeps the production Vite config clean.
// `vitest run` reads this; `vite dev/build` continues to read vite.config.ts.
export default defineConfig({
  plugins: [react()],
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
