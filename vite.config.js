import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Lets a Cloudflare Tunnel (random *.trycloudflare.com host each run) or
    // any LAN device reach this dev server — Vite otherwise rejects unknown
    // Host headers by default as anti DNS-rebinding protection. Dev-only,
    // never applies to the production build.
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
