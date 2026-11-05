import { CHAINS } from '../data/seed.js'

const HOME = 'ethereum'
const RAIL = 'USDC'

export function cashChannels(assets) {
  return Object.keys(CHAINS).map((chain) => {
    const row = (assets || []).find((a) => a.symbol === RAIL && a.chain === chain)
    const amount = row?.amount || 0
    return {
      id: chain,
      chain,
      name: CHAINS[chain]?.name || chain,
      short: CHAINS[chain]?.short || chain,
      tone: CHAINS[chain]?.tone || '#8ea4c8',
      amount,
      value: amount,
      dry: amount < 1,
      home: chain === HOME,
    }
  })
}

export function channelOf(assets, chain) {
  return cashChannels(assets).find((c) => c.chain === chain) || null
}

export function homeFloat(assets) {
  return channelOf(assets, HOME)?.amount || 0
}

export function channelBrief(assets) {
  const rows = cashChannels(assets)
  const live = rows.filter((c) => !c.dry)
  const dry = rows.filter((c) => c.dry)
  const total = rows.reduce((s, c) => s + c.amount, 0)
  const bits = live.map((c) => `${c.short} $${Math.round(c.amount).toLocaleString()}`)
  const dryNote = dry.length ? ` Dry: ${dry.map((c) => c.short).join(', ')}.` : ''
  return `Cash rails hold $${Math.round(total).toLocaleString()} USDC. ${bits.join(' · ') || 'All dry'}.${dryNote}`
}
