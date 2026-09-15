import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Stamped into the bundle so a pasted error report says WHICH deploy produced
// it. On 2026-08-17 an outage looked like "works locally, broken live" for an
// hour; the first thing needed was proof the two were different builds.
// Falls back gracefully — a shallow Vercel checkout still has git, but this
// must never be the thing that fails a deploy.
function buildId() {
  let sha = 'nogit'
  try {
    sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch { /* not a repo, or git unavailable */ }
  return `${sha} ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`
}

// Stamps the SAME id into index.html so a running tab can cheaply ask "is index.html still
// mine?" without loading a new JS bundle - see src/updateCheck.js. Computed once and shared with
// __BUILD_ID__ below so the two never disagree with each other.
function htmlBuildIdPlugin(id) {
  return {
    name: 'html-build-id',
    transformIndexHtml(html) {
      return html.replace('</head>', `    <meta name="build-id" content="${id}" />\n  </head>`)
    },
  }
}

const BUILD_ID = buildId()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), htmlBuildIdPlugin(BUILD_ID)],
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
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
