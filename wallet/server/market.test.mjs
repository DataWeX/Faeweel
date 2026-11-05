import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'
import {
  createMarketService,
  MarketUnavailableError,
  normalizeMarkets,
} from './market.js'
import { createMarketApp } from './market-server.js'

const sourceTimestamp = '2026-11-05T12:00:00.000Z'

function fixtureRows() {
  return [
    {
      id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', current_price: 101.5,
      market_cap: 2_000_000, price_change_percentage_24h: 10.5,
      total_volume: 50_000, last_updated: sourceTimestamp,
    },
    {
      id: 'ethereum', symbol: 'ETH', name: 'Ethereum', current_price: 5.25,
      market_cap: null, price_change_percentage_24h: -2,
      total_volume: 0, last_updated: sourceTimestamp,
    },
    { id: 'not-allowed', symbol: 'NO', name: 'Ignored', current_price: 1 },
  ]
}

function response(rows, { ok = true } = {}) {
  return { ok, json: async () => rows }
}

test('normalizes supported CoinGecko assets and describes observations without profit claims', () => {
  const result = normalizeMarkets(fixtureRows(), '2026-11-05T12:01:00.000Z')

  assert.equal(result.source, 'CoinGecko')
  assert.equal(result.assets.length, 2)
  assert.deepEqual(result.assets[0], {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    price: 101.5,
    marketCap: 2_000_000,
    change24h: 10.5,
    volume24h: 50_000,
    sourceUpdatedAt: sourceTimestamp,
    opportunity: {
      observation: 'Price is up 10.50% over 24 hours. This is descriptive, not predictive, and does not imply profit.',
      risk: {
        level: 'elevated',
        basis: 'A simple 24-hour move threshold only; this is not a full risk assessment.',
      },
    },
  })
  assert.equal(result.sourceUpdatedAt, sourceTimestamp)
  assert.equal(result.stale, false)
  assert.equal(result.assets[1].marketCap, null)
  assert.equal(result.assets[1].opportunity.risk.level, 'not_elevated_by_24h_move')
  assert.throws(() => normalizeMarkets([{ id: 'bitcoin', current_price: 0 }]), MarketUnavailableError)
})

test('uses the fixed CoinGecko allowlist URL and does not accept malformed responses', async () => {
  let requestedUrl
  const service = createMarketService({
    fetchImpl: async (url) => {
      requestedUrl = url
      return response(fixtureRows())
    },
    now: () => Date.parse('2026-11-05T12:01:00.000Z'),
  })
  await service.getMarketData()
  assert.equal(requestedUrl, 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin%2Cethereum%2Csolana%2Cchainlink%2Cuniswap%2Caave')

  const invalid = createMarketService({ fetchImpl: async () => response({ unexpected: true }) })
  await assert.rejects(invalid.getMarketData(), { code: 'upstream_invalid_data' })
})

test('reports upstream HTTP failure as unavailable instead of fabricating market values', async () => {
  const service = createMarketService({ fetchImpl: async () => response([], { ok: false }) })
  await assert.rejects(service.getMarketData(), { code: 'upstream_http_error' })
})

test('times out a stalled upstream request', async () => {
  let wasAborted = false
  const service = createMarketService({
    fetchImpl: (_url, { signal }) => new Promise(() => {
      signal.addEventListener('abort', () => { wasAborted = true }, { once: true })
    }),
    timeoutMs: 10,
  })
  await assert.rejects(service.getMarketData(), { code: 'upstream_timeout' })
  assert.equal(wasAborted, true)
})

test('serves the last successful snapshot as explicitly stale after refresh failure', async () => {
  let time = Date.parse('2026-11-05T12:01:00.000Z')
  let calls = 0
  const service = createMarketService({
    fetchImpl: async () => {
      calls += 1
      if (calls > 1) throw new Error('network unavailable')
      return response(fixtureRows())
    },
    now: () => time,
    ttlMs: 60_000,
  })

  const current = await service.getMarketData()
  time += 60_001
  const stale = await service.getMarketData()
  assert.equal(stale.stale, true)
  assert.equal(stale.staleReason, 'upstream_unavailable')
  assert.equal(stale.fetchedAt, current.fetchedAt)
  assert.equal(stale.sourceUpdatedAt, sourceTimestamp)
  assert.deepEqual(stale.assets, current.assets)
  assert.equal(calls, 2)
})

test('deduplicates concurrent refresh requests', async () => {
  let calls = 0
  let release
  const waitForResponse = new Promise((resolve) => { release = resolve })
  const service = createMarketService({
    fetchImpl: async () => {
      calls += 1
      await waitForResponse
      return response(fixtureRows())
    },
  })

  const first = service.getMarketData()
  const second = service.getMarketData()
  await Promise.resolve()
  assert.equal(calls, 1)
  release()
  const [firstResult, secondResult] = await Promise.all([first, second])
  assert.deepEqual(firstResult, secondResult)
  assert.equal(calls, 1)
})

test('exposes only health and market routes, with 503 when data is unavailable', async (t) => {
  const app = createMarketApp({
    service: createMarketService({ fetchImpl: async () => response([], { ok: false }) }),
  })
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())))
  const base = `http://127.0.0.1:${server.address().port}`

  const health = await fetch(`${base}/health`)
  assert.equal(health.status, 200)
  assert.deepEqual(await health.json(), { status: 'ok' })

  const unavailable = await fetch(`${base}/api/market`)
  assert.equal(unavailable.status, 503)
  assert.deepEqual((await unavailable.json()).error.code, 'upstream_http_error')

  const operatorRoute = await fetch(`${base}/api/operator/status`)
  assert.equal(operatorRoute.status, 404)
})
