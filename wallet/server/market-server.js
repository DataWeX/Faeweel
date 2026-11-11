import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import express from 'express'
import { createMarketHandler, createMarketService } from './market.js'

export function createMarketApp({ service = createMarketService() } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.get('/health', (_request, response) => response.json({ status: 'ok' }))
  app.get('/api/market', createMarketHandler(service))
  app.use((_request, response) => response.status(404).json({
    error: { code: 'not_found', message: 'Route not found.' },
  }))
  return app
}

export function startMarketServer() {
  const port = Number(process.env.MARKET_PORT || 3001)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new TypeError('MARKET_PORT must be an integer from 1 to 65535.')
  }

  const app = createMarketApp()
  return app.listen(port, '0.0.0.0', () => {
    console.log(`Faewheel market API on :${port}`)
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startMarketServer()
}
