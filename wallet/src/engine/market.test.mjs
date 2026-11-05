import test from 'node:test'
import assert from 'node:assert/strict'
import { validMarketSnapshot } from './market.js'
const snapshot = { source: 'CoinGecko', stale: false, fetchedAt: new Date().toISOString(), assets: [{ id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', price: 100, marketCap: null, volume24h: null, change24h: null }] }
test('accepts explicitly unavailable optional metrics without inventing zero values', () => {
  assert.equal(validMarketSnapshot(snapshot), true)
})
test('rejects non-provider data and malformed snapshots', () => {
  for (const data of [null, { ...snapshot, source: 'demo' }, { ...snapshot, stale: undefined }, { ...snapshot, fetchedAt: 'bad' }, { ...snapshot, assets: [] }, { ...snapshot, assets: [{ ...snapshot.assets[0], price: null }] }, { ...snapshot, assets: [{ ...snapshot.assets[0], volume24h: -1 }] }]) assert.equal(validMarketSnapshot(data), false)
})
