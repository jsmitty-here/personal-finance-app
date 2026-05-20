import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const repoSlug = process.env.GITHUB_REPOSITORY
const repoName = repoSlug?.match(/^[^/]+\/([^/]+)$/)?.[1]
const base = process.env.GITHUB_ACTIONS && repoName ? `/${repoName}/` : '/'

export default defineConfig({
  base,
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Personal Finance App',
        short_name: 'Finance',
        theme_color: '#ffffff',
        icons: [{ src: `${base}vite.svg`, sizes: '192x192', type: 'image/svg+xml' }],
      },
    }),
  ],
})
