import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
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
        icons: [{ src: '/vite.svg', sizes: '192x192', type: 'image/svg+xml' }],
      },
    }),
  ],
})
