import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.monkeycode-ai.live'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq, req) => {
            const forwarded = req.headers['x-forwarded-host']
            const host = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || req.headers.host || ''
            const protoHeader = req.headers['x-forwarded-proto']
            const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) || 'https'
            proxyReq.setHeader('x-forwarded-host', String(host).split(',')[0].trim())
            proxyReq.setHeader('x-forwarded-proto', String(proto).split(',')[0].trim())
          })
        },
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.monkeycode-ai.live'],
  },
})
