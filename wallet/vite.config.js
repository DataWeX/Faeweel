import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function workspaceEntry(req, res, next) {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname === '/workspace' || url.pathname === '/workspace/') {
    res.writeHead(302, { Location: '/workspace/index.html' + url.search })
    res.end()
  } else next()
}

export default defineConfig({
  plugins: [react(), {
    name: 'helix-workspace-entry',
    configureServer(server) { server.middlewares.use(workspaceEntry) },
    configurePreviewServer(server) { server.middlewares.use(workspaceEntry) },
  }],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: { '/api/market': 'http://127.0.0.1:3001', '/health': 'http://127.0.0.1:3001' },
  },
  preview: { host: '0.0.0.0', port: 5173 },
})
