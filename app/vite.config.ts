import fs from 'node:fs'
import path from 'node:path'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// When VITE_CONTENT_FROM_API is on (staging / production builds), the
// strict-tier corpus is served auth-gated from R2 via /api/content — it
// must NOT ship as unauthenticated static JSON in the Pages bundle. Vite
// copies the whole `public/` tree into `dist/` verbatim (no per-file
// filter hook for publicDir), so the simplest robust mechanism is to
// prune the two gated directories out of `dist/` right after the copy
// completes. `closeBundle` is the last build hook, so publicDir is fully
// written by the time it runs. `apply: 'build'` means dev/vitest/e2e —
// which keep the flag OFF and serve public/ locally — are never touched.
// Figures, frameworks, and normering stay public and are left in place.
function excludeGatedContent(): Plugin {
  const gated = process.env.VITE_CONTENT_FROM_API === 'true'
  const GATED_DIRS = ['data', 'explanations']
  return {
    name: 'hpc-exclude-gated-content',
    apply: 'build',
    closeBundle() {
      if (!gated) return
      for (const dir of GATED_DIRS) {
        const target = path.resolve(__dirname, 'dist', dir)
        if (fs.existsSync(target)) {
          fs.rmSync(target, { recursive: true, force: true })
          // biome-ignore lint/suspicious/noConsole: build-time diagnostic
          console.log(`[hpc-exclude-gated-content] pruned dist/${dir} (served from R2 via /api/content)`)
        }
      }
    },
  }
}

// https://vite.dev/config/
// Plugin order matters: TanStackRouterVite must run BEFORE @vitejs/plugin-react
// so the route tree generator sees raw .tsx files before they're transformed.
export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    excludeGatedContent(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Question dataset (public/data/*.json) is fetched lazily at
        // runtime, NOT precached — a fresh-install user shouldn't
        // download 6 MB before they've even decided to drill. The HTTP
        // cache + loadBank()'s in-memory Promise covers warm hits.
        //
        // Figures (public/figures/*.svg) are also lazy-fetched by
        // QuestionFigure.tsx, so excluded from precache. Including
        // them would add ~3 MB to the install bundle AND make Vite's
        // dev-time precache scan choke when the parser regenerates
        // the figure set with different filenames between requests
        // (stale paths from a previous scan → ENOENT in the CSS
        // analysis plugin).
        globPatterns: [
          '**/*.{js,css,html,ico,png,woff2}',
          'vite.svg', // app icon — keep precached
        ],
      },
      manifest: {
        name: 'HP-Coach',
        short_name: 'HPCoach',
        description: 'Coach för svenska högskoleprovet',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
