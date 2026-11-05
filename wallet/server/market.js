const UPSTREAM_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin%2Cethereum%2Csolana%2Cchainlink%2Cuniswap%2Caave'
const ALLOWED_IDS = new Set(['bitcoin', 'ethereum', 'solana', 'chainlink', 'uniswap', 'aave'])
const CACHE_TTL_MS = 60_000
const REQUEST_TIMEOUT_MS = 5_000

export class MarketUnavailableError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'MarketUnavailableError'
    this.code = code
  }
}

function asTimestamp(value) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return null
  return new Date(value).toISOString()
}

function finiteOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function opportunity(change24h) {
  if (change24h === null) {
    return {
      observation: '24-hour price change is unavailable.',
      risk: { level: 'unknown', basis: 'No 24-hour change was provided.' },
    }
  }

  const magnitude = Math.abs(change24h)
  const level = magnitude >= 10 ? 'elevated' : magnitude >= 5 ? 'moderate' : 'not_elevated_by_24h_move'
  const direction = change24h > 0 ? 'up' : change24h < 0 ? 'down' : 'unchanged'

  return {
    observation: `Price is ${direction} ${Math.abs(change24h).toFixed(2)}% over 24 hours. This is descriptive, not predictive, and does not imply profit.`,
    risk: {
      level,
      basis: 'A simple 24-hour move threshold only; this is not a full risk assessment.',
    },
  }
}

export function normalizeMarkets(rows, fetchedAt = new Date().toISOString()) {
  if (!Array.isArray(rows)) throw new MarketUnavailableError('upstream_invalid_data', 'Market source returned an invalid response.')

  const assets = rows
    .filter((row) => row && ALLOWED_IDS.has(row.id))
    .map((row) => {
      if (typeof row.symbol !== 'string' || typeof row.name !== 'string'
        || typeof row.current_price !== 'number' || !Number.isFinite(row.current_price) || row.current_price <= 0) {
        return null
      }

      const change24h = finiteOrNull(row.price_change_percentage_24h)
      return {
        id: row.id,
        symbol: row.symbol.toLowerCase(),
        name: row.name,
        price: row.current_price,
        marketCap: finiteOrNull(row.market_cap),
        change24h,
        volume24h: finiteOrNull(row.total_volume),
        sourceUpdatedAt: asTimestamp(row.last_updated),
        opportunity: opportunity(change24h),
      }
    })
    .filter(Boolean)

  if (assets.length === 0) throw new MarketUnavailableError('upstream_invalid_data', 'Market source returned no usable supported assets.')

  const timestamps = assets.map((asset) => asset.sourceUpdatedAt).filter(Boolean).sort()
  return {
    source: 'CoinGecko',
    fetchedAt,
    sourceUpdatedAt: timestamps.at(-1) ?? null,
    assets,
    stale: false,
  }
}

export function createMarketService({
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  ttlMs = CACHE_TTL_MS,
  timeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('A fetch implementation is required.')
  if (!Number.isFinite(ttlMs) || ttlMs < 0) throw new TypeError('ttlMs must be a non-negative number.')
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new TypeError('timeoutMs must be a positive number.')

  let cache = null
  let inFlight = null

  const currentTime = () => {
    const value = now()
    return value instanceof Date ? value.getTime() : Number(value)
  }

  async function refresh() {
    const controller = new AbortController()
    let timer
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort()
        reject(new MarketUnavailableError('upstream_timeout', 'Market source request timed out.'))
      }, timeoutMs)
    })

    try {
      const rows = await Promise.race([
        Promise.resolve()
          .then(() => fetchImpl(UPSTREAM_URL, { signal: controller.signal }))
          .then(async (response) => {
            if (!response || !response.ok) {
              throw new MarketUnavailableError('upstream_http_error', 'Market source returned an unsuccessful response.')
            }
            return response.json()
          }),
        timeout,
      ])
      const fetchedAt = new Date(currentTime()).toISOString()
      const data = normalizeMarkets(rows, fetchedAt)
      cache = { data, receivedAt: currentTime() }
      return data
    } catch (error) {
      if (error instanceof MarketUnavailableError) throw error
      throw new MarketUnavailableError('upstream_unavailable', 'Market source could not be reached or parsed.')
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    async getMarketData() {
      const time = currentTime()
      if (cache && time - cache.receivedAt < ttlMs) {
        return structuredClone(cache.data)
      }

      if (!inFlight) {
        inFlight = refresh()
      }
      const pending = inFlight

      try {
        return structuredClone(await pending)
      } catch (error) {
        if (cache) {
          return {
            ...structuredClone(cache.data),
            stale: true,
            staleReason: error.code,
          }
        }
        throw error
      } finally {
        if (inFlight === pending) inFlight = null
      }
    },
  }
}

export function createMarketHandler(service) {
  if (!service || typeof service.getMarketData !== 'function') {
    throw new TypeError('A market service is required.')
  }

  return async function marketHandler(_request, response) {
    try {
      response.json(await service.getMarketData())
    } catch (error) {
      const knownError = error instanceof MarketUnavailableError
      response.status(503).json({
        error: {
          code: knownError ? error.code : 'market_unavailable',
          message: knownError ? error.message : 'Market data is temporarily unavailable.',
        },
      })
    }
  }
}
