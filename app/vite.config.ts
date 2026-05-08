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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
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
