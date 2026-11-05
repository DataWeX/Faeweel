import { CHAINS, TOKENS } from '../data/seed.js'

export function assetValue(a) {
  return a.amount * a.price
}

export function totalValue(assets) {
  return assets.reduce((s, a) => s + assetValue(a), 0)
}

export function bySymbol(assets) {
  const map = {}
  for (const a of assets) {
    if (!map[a.symbol]) {
      map[a.symbol] = { symbol: a.symbol, amount: 0, value: 0, price: a.price, chains: [] }
    }
    map[a.symbol].amount += a.amount
    map[a.symbol].value += assetValue(a)
    map[a.symbol].price = a.price
    if (!map[a.symbol].chains.includes(a.chain)) map[a.symbol].chains.push(a.chain)
  }
  return Object.values(map).sort((a, b) => b.value - a.value)
}

export function byChain(assets) {
  const map = {}
  for (const a of assets) {
    if (!map[a.chain]) map[a.chain] = { chain: a.chain, value: 0, assets: [] }
    map[a.chain].value += assetValue(a)
    map[a.chain].assets.push(a)
  }
  return Object.values(map).sort((a, b) => b.value - a.value)
}

export function findAsset(assets, symbol, chain) {
  return assets.find((a) => a.symbol === symbol && a.chain === chain) || null
}

export function findAnyAsset(assets, symbol) {
  const matches = assets.filter((a) => a.symbol === symbol && a.amount > 1e-12)
  if (!matches.length) return null
  return matches.sort((a, b) => assetValue(b) - assetValue(a))[0]
}

export function available(assets, symbol, chain) {
  if (chain) {
    const a = findAsset(assets, symbol, chain)
    return a ? a.amount : 0
  }
  return assets.filter((a) => a.symbol === symbol).reduce((s, a) => s + a.amount, 0)
}

function resolve(assets, symbol, chain) {
  if (chain) {
    const exact = findAsset(assets, symbol, chain)
    if (exact) return exact
  }
  return findAnyAsset(assets, symbol)
}

function priceOf(assets, symbol) {
  const a = assets.find((x) => x.symbol === symbol)
  if (a) return a.price
  return TOKENS[symbol] ? 1 : null
}

function label(id) {
  return CHAINS[id]?.name || id || 'unknown chain'
}

function trim(n) {
  return Number(n.toPrecision(6))
}

export function quoteStep(step, assets) {
  if (!step?.ok) return { usd: 0, insufficient: step?.error }

  if (step.kind === 'query' || step.kind === 'help' || step.kind === 'policy') {
    return { usd: 0 }
  }

  if (step.kind === 'send') {
    const asset = resolve(assets, step.token, step.chain)
    const usd = step.amount * (asset?.price || priceOf(assets, step.token) || 0)
    if (!asset) return { usd, insufficient: `No ${step.token} on ${label(step.chain)}` }
    if (asset.amount + 1e-12 < step.amount) {
      return { usd, asset, insufficient: `Only ${trim(asset.amount)} ${step.token} on ${label(asset.chain)}` }
    }
    return { usd, asset, feeUsd: Math.max(0.28, usd * 0.0007) }
  }

  if (step.kind === 'swap') {
    const asset = resolve(assets, step.fromToken, step.chain)
    const usd = step.amount * (asset?.price || priceOf(assets, step.fromToken) || 0)
    if (!asset) return { usd, insufficient: `No ${step.fromToken} on ${label(step.chain)}` }
    if (asset.amount + 1e-12 < step.amount) {
      return { usd, asset, insufficient: `Only ${trim(asset.amount)} ${step.fromToken} available` }
    }
    const toPrice = priceOf(assets, step.toToken) || 1
    const feeUsd = usd * 0.003
    const toAmount = (usd - feeUsd) / toPrice
    return { usd, asset, toPrice, toAmount, feeUsd }
  }

  if (step.kind === 'bridge') {
    const asset = resolve(assets, step.token, step.fromChain)
    const usd = step.amount * (asset?.price || priceOf(assets, step.token) || 0)
    if (!asset) return { usd, insufficient: `No ${step.token} on ${label(step.fromChain)}` }
    if (asset.amount + 1e-12 < step.amount) {
      return { usd, asset, insufficient: `Only ${trim(asset.amount)} ${step.token} on ${label(step.fromChain)}` }
    }
    return { usd, asset, feeUsd: Math.max(1.1, usd * 0.0014), receive: step.amount * 0.998 }
  }

  if (step.kind === 'stake' || step.kind === 'unstake') {
    const asset = resolve(assets, step.token, step.chain)
    const usd = step.amount * (asset?.price || priceOf(assets, step.token) || 0)
    if (!asset) return { usd, insufficient: `No ${step.token} on ${label(step.chain)}` }
    if (step.kind === 'stake' && asset.amount + 1e-12 < step.amount) {
      return { usd, asset, insufficient: `Only ${trim(asset.amount)} ${step.token} available` }
    }
    return { usd, asset, feeUsd: 0.75 }
  }

  if (step.kind === 'rebalance') {
    const total = totalValue(assets)
    const current = assets.filter((a) => a.symbol === step.token).reduce((s, a) => s + assetValue(a), 0)
    const target = total * (step.percent / 100)
    const delta = target - current
    return { usd: Math.abs(delta), total, current, target, delta, feeUsd: Math.abs(delta) * 0.003 }
  }

  return { usd: 0 }
}

function debit(next, symbol, chain, amount) {
  const a = next.find((x) => x.symbol === symbol && x.chain === chain)
  if (!a) throw new Error(`Missing ${symbol} on ${chain}`)
  if (a.amount + 1e-10 < amount) throw new Error(`Insufficient ${symbol} on ${chain}`)
  a.amount -= amount
}

function credit(next, symbol, chain, amount, price) {
  const a = next.find((x) => x.symbol === symbol && x.chain === chain)
  if (a) a.amount += amount
  else {
    next.push({
      id: `${symbol.toLowerCase()}-${chain}-${Date.now()}`,
      symbol,
      chain,
      amount,
      price: price || 1,
    })
  }
}

export function applyStep(assets, step, quote) {
  const next = assets.map((a) => ({ ...a }))

  if (step.kind === 'send') {
    debit(next, step.token, quote.asset.chain, step.amount)
  }

  if (step.kind === 'swap') {
    debit(next, step.fromToken, quote.asset.chain, step.amount)
    credit(next, step.toToken, quote.asset.chain, quote.toAmount, quote.toPrice)
  }

  if (step.kind === 'bridge') {
    debit(next, step.token, step.fromChain, step.amount)
    credit(next, step.token, step.toChain, quote.receive, quote.asset.price)
  }

  if (step.kind === 'stake') {
    debit(next, step.token, quote.asset.chain, step.amount)
  }

  if (step.kind === 'unstake') {
    credit(next, step.token, quote.asset.chain, step.amount, quote.asset.price)
  }

  if (step.kind === 'rebalance') {
    const chain = quote.asset?.chain || step.chain || 'ethereum'
    const token = step.token
    const usdc = resolve(next, 'USDC', chain) || resolve(next, 'USDC')
    if (!usdc) throw new Error('Need USDC as the rebalance pair')
    if (quote.delta > 0) {
      if (usdc.amount + 1e-10 < quote.delta) throw new Error('Not enough USDC to buy the target')
      debit(next, 'USDC', usdc.chain, quote.delta)
      const px = priceOf(next, token) || 1
      credit(next, token, chain, quote.delta / px, px)
    } else {
      const sellUsd = Math.abs(quote.delta)
      const px = priceOf(next, token) || 1
      const sellAmt = sellUsd / px
      const src = resolve(next, token, chain) || resolve(next, token)
      if (!src || src.amount + 1e-10 < sellAmt) throw new Error(`Not enough ${token} to sell`)
      debit(next, token, src.chain, sellAmt)
      credit(next, 'USDC', usdc.chain, sellUsd, 1)
    }
  }

  return next.filter((a) => a.amount > 1e-10)
}

export function activityFromStep(step, quote, hash, note) {
  const ts = Date.now()
  const base = { id: `tx-${ts}-${Math.random().toString(16).slice(2, 6)}`, hash, status: 'confirmed', ts, note: note || step.raw }

  if (step.kind === 'send') {
    return {
      ...base,
      kind: 'send',
      symbol: step.token,
      amount: step.amount,
      chain: quote.asset?.chain || step.chain,
      counterparty: step.contact?.name,
    }
  }
  if (step.kind === 'swap') {
    return {
      ...base,
      kind: 'swap',
      fromSymbol: step.fromToken,
      toSymbol: step.toToken,
      fromAmount: step.amount,
      toAmount: quote.toAmount,
      chain: quote.asset?.chain || step.chain,
    }
  }
  if (step.kind === 'bridge') {
    return {
      ...base,
      kind: 'bridge',
      symbol: step.token,
      amount: step.amount,
      fromChain: step.fromChain,
      toChain: step.toChain,
    }
  }
  if (step.kind === 'stake' || step.kind === 'unstake') {
    return {
      ...base,
      kind: step.kind,
      symbol: step.token,
      amount: step.amount,
      chain: quote.asset?.chain || step.chain,
    }
  }
  if (step.kind === 'rebalance') {
    return { ...base, kind: 'rebalance', symbol: step.token, amount: step.percent, chain: step.chain }
  }
  if (step.kind === 'policy') {
    return { ...base, kind: 'policy', symbol: 'RULE', amount: step.value, chain: 'ethereum' }
  }
  return { ...base, kind: step.kind }
}

export function fakeHash() {
  const hex = '0123456789abcdef'
  let s = '0x'
  for (let i = 0; i < 10; i++) s += hex[Math.floor(Math.random() * 16)]
  s += '··'
  for (let i = 0; i < 4; i++) s += hex[Math.floor(Math.random() * 16)]
  return s
}

export function driftPrices(assets) {
  return assets.map((a) => {
    if (a.symbol === 'USDC') return a
    const mag = a.symbol === 'WBTC' ? 0.0016 : a.symbol === 'ETH' ? 0.0022 : 0.0038
    const delta = (Math.random() - 0.5) * 2 * mag
    return { ...a, price: Math.max(0.01, a.price * (1 + delta)) }
  })
}

export function cloneAssets(assets) {
  return assets.map((a) => ({ ...a }))
}
