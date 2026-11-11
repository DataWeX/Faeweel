export function validMarketSnapshot(data) {
  const optionalMetric = (value, minimum = -Infinity) => value === null || (Number.isFinite(value) && value >= minimum)
  return data?.source === 'CoinGecko'
    && typeof data.stale === 'boolean'
    && Number.isFinite(Date.parse(data.fetchedAt))
    && Array.isArray(data.assets)
    && data.assets.length > 0
    && data.assets.every(a => typeof a.id === 'string' && typeof a.symbol === 'string' && typeof a.name === 'string'
      && Number.isFinite(a.price) && a.price > 0
      && optionalMetric(a.marketCap, 0) && optionalMetric(a.volume24h, 0) && optionalMetric(a.change24h))
}
