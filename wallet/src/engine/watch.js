import { bySymbol, totalValue } from './wallet.js'

export function defaultWatches() {
  return [
    { id: 'w-eth-weight', kind: 'weight', token: 'ETH', op: 'above', value: 62, label: 'ETH sleeve above 62%' },
    { id: 'w-stables', kind: 'usd', token: 'USDC', op: 'below', value: 12000, label: 'USDC dry powder below $12,000' },
    { id: 'w-cap', kind: 'cap', op: 'below', value: 800, label: 'Day window under $800' },
  ]
}

export function readWatch(assets, policies, watch) {
  if (watch.kind === 'weight') {
    const total = totalValue(assets)
    const sleeve = bySymbol(assets).find((s) => s.symbol === watch.token)
    const v = total && sleeve ? (sleeve.value / total) * 100 : 0
    return { value: v, unit: '%', tripped: cmp(v, watch.op, watch.value) }
  }
  if (watch.kind === 'price') {
    const row = assets.find((a) => a.symbol === watch.token)
    const v = row?.price || 0
    return { value: v, unit: 'usd', tripped: cmp(v, watch.op, watch.value) }
  }
  if (watch.kind === 'usd') {
    const sleeve = bySymbol(assets).find((s) => s.symbol === watch.token)
    const v = sleeve?.value || 0
    return { value: v, unit: 'usd', tripped: cmp(v, watch.op, watch.value) }
  }
  if (watch.kind === 'cap') {
    const v = Math.max(0, (policies.dailyCapUsd || 0) - (policies.spentTodayUsd || 0))
    return { value: v, unit: 'usd', tripped: cmp(v, watch.op, watch.value) }
  }
  return { value: 0, unit: '', tripped: false }
}

function cmp(v, op, target) {
  return op === 'below' ? v < target : v > target
}

export function remedyFor(watch) {
  if (watch.kind === 'weight' && watch.op === 'above') {
    const target = Math.max(40, watch.value - 7)
    return {
      utterance: `Rebalance to ${target}% ${watch.token}`,
      note: `Sleeve is heavy. I drafted a rebalance back toward ${target}%.`,
    }
  }
  if (watch.kind === 'weight' && watch.op === 'below') {
    const target = watch.value + 5
    return {
      utterance: `Rebalance to ${target}% ${watch.token}`,
      note: `Sleeve is light. I drafted a buy-back toward ${target}%.`,
    }
  }
  if (watch.kind === 'usd' && watch.token === 'USDC' && watch.op === 'below') {
    return {
      utterance: 'Swap 0.25 ETH for USDC',
      note: 'Dry powder is thin. I drafted a small ETH → USDC swap.',
    }
  }
  if (watch.kind === 'cap') {
    return {
      utterance: `Set daily cap to ${Math.round(watch.value * 4)}`,
      note: 'Day window is nearly spent. I drafted a cap raise — seal only if you mean it.',
    }
  }
  if (watch.kind === 'price' && watch.op === 'below') {
    return {
      utterance: `Swap 400 USDC for ${watch.token}`,
      note: `${watch.token} marked below your line. I drafted a modest buy.`,
    }
  }
  return null
}

export function scanWatches(assets, policies, watches, now = Date.now()) {
  const alerts = []
  const next = watches.map((w) => {
    const reading = readWatch(assets, policies, w)
    const cool = w.lastFired && now - w.lastFired < 45_000
    if (reading.tripped && !cool) {
      const remedy = remedyFor(w)
      alerts.push({
        watch: w,
        reading,
        remedy,
        text: `Watch tripped: ${w.label}. Now ${fmt(reading.value, reading.unit)}.${remedy ? ` ${remedy.note}` : ''}`,
      })
      return { ...w, lastFired: now, lastValue: reading.value }
    }
    return { ...w, lastValue: reading.value }
  })
  return { watches: next, alerts }
}

function fmt(v, unit) {
  if (unit === '%') return `${v.toFixed(1)}%`
  return `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function parseWatchDraft(clause) {
  return clause
}
