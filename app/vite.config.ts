import path from 'node:path'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// Plugin order matters: TanStackRouterVite must run BEFORE @vitejs/plugin-react
// so the route tree generator sees raw .tsx files before they're transformed.
export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
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
