import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    // Listen on the LAN as well as localhost, so a phone on the same Wi-Fi
    // network can open the Vite dev server.
    host: true,
    proxy: {
      // Keep browser requests same-origin during local development. Vite makes
      // the server-to-server hop to FastAPI, so this also avoids LAN CORS
      // issues when testing from a phone.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
