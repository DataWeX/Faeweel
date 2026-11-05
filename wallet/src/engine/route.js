import { CHAINS } from '../data/seed.js'
import { applyStep, available, cloneAssets, quoteStep } from './wallet.js'

function label(id) {
  return CHAINS[id]?.name || id
}

function price(assets, symbol) {
  return assets.find((a) => a.symbol === symbol)?.price || 1
}

function mkSwap(fromToken, toToken, amount, chain, why) {
  return {
    ok: true,
    kind: 'swap',
    fromToken,
    toToken,
    amount: Number(Number(amount).toPrecision(6)),
    chain,
    raw: `route swap ${fromToken}→${toToken}`,
    summary: `Swap ${Number(amount.toPrecision(4))} ${fromToken} for ${toToken} on ${label(chain)}`,
    synthetic: true,
    why,
  }
}

function mkBridge(token, amount, from, to, why) {
  const amt = Number((amount * 1.002).toPrecision(7))
  return {
    ok: true,
    kind: 'bridge',
    token,
    amount: amt,
    fromChain: from,
    toChain: to,
    raw: `route bridge ${token}`,
    summary: `Bridge ${Number(amt.toPrecision(4))} ${token} from ${label(from)} to ${label(to)}`,
    synthetic: true,
    why,
  }
}

function richest(assets, symbol, exceptChain) {
  return assets
    .filter((a) => a.symbol === symbol && a.chain !== exceptChain && a.amount > 1e-12)
    .sort((a, b) => b.amount - a.amount)[0] || null
}

function funders(assets, chain, usdNeed, exclude) {
  return assets
    .filter((a) => a.chain === chain && a.symbol !== exclude && a.amount * a.price >= usdNeed)
    .sort((a, b) => (a.symbol === 'ETH' ? -1 : b.symbol === 'ETH' ? 1 : b.amount * b.price - a.amount * a.price))
}

function scorePath(extras, finalStep, assets) {
  let sim = cloneAssets(assets)
  let fee = 0
  for (const unit of [...extras, finalStep]) {
    const q = quoteStep(unit, sim)
    if (q.insufficient) return { fee: Infinity, ok: false }
    fee += q.feeUsd || 0
    if (unit.kind === 'swap') fee += 2
    try {
      sim = applyStep(sim, unit, q)
    } catch {
      return { fee: Infinity, ok: false }
    }
  }
  return { fee, ok: true }
}

function sendCandidates(step, assets) {
  const dest = step.chain
  const token = step.token
  const need = step.amount
  const local = available(assets, token, dest)
  const px = price(assets, token)
  const list = []

  if (step.fundFrom) {
    const src = assets.find((a) => a.symbol === step.fundFrom && a.chain === dest && a.amount > 0)
      || assets.find((a) => a.symbol === step.fundFrom && a.amount > 0)
    if (src) {
      const fromAmt = (need * px * 1.004) / (src.price || 1)
      const extras = []
      if (src.chain !== dest) {
        extras.push(mkBridge(src.symbol, fromAmt, src.chain, dest, `Source ${step.fundFrom} sits on ${label(src.chain)}.`))
      }
      extras.push(mkSwap(step.fundFrom, token, fromAmt, dest, `You asked to fund ${token} from ${step.fundFrom}.`))
      list.push({ extras, why: extras.map((e) => e.why).join(' ') })
      return list
    }
  }

  if (local + 1e-8 >= need) {
    list.push({ extras: [], why: `${trim(local)} ${token} already sits on ${label(dest)}.` })
  }

  const shortfall = Math.max(0, need - local)
  const bridgedNeed = shortfall / 0.998
  const other = richest(assets, token, dest)
  if (other && other.amount + 1e-8 >= bridgedNeed && shortfall > 1e-8) {
    list.push({
      extras: [mkBridge(token, bridgedNeed, other.chain, dest, `Short ${trim(shortfall)} ${token} on ${label(dest)}; pulling from ${label(other.chain)} after bridge haircut.`)],
      why: `Bridge ${trim(bridgedNeed)} ${token} from ${label(other.chain)} so ${label(dest)} can pay.`,
    })
  }

  const usdNeed = shortfall * px * 1.004
  const localFund = funders(assets, dest, usdNeed, token)[0]
  if (localFund && shortfall > 1e-8) {
    const fromAmt = usdNeed / localFund.price
    list.push({
      extras: [mkSwap(localFund.symbol, token, fromAmt, dest, `Mint the missing ${token} from ${localFund.symbol} already on ${label(dest)}.`)],
      why: `Swap ${localFund.symbol} on ${label(dest)} to cover the gap.`,
    })
  }

  if (shortfall > 1e-8) {
    const remoteFund = assets
      .filter((a) => a.chain !== dest && a.symbol !== token && a.amount * a.price >= usdNeed)
      .sort((a, b) => b.amount * b.price - a.amount * a.price)[0]
    if (remoteFund) {
      const fromAmt = usdNeed / remoteFund.price
      if (remoteFund.symbol === token) {
        list.push({
          extras: [mkBridge(token, shortfall, remoteFund.chain, dest, `Pull ${token} from ${label(remoteFund.chain)}.`)],
          why: `Bridge from ${label(remoteFund.chain)}.`,
        })
      } else {
        list.push({
          extras: [
            mkSwap(remoteFund.symbol, token, fromAmt, remoteFund.chain, `Best free capital is ${remoteFund.symbol} on ${label(remoteFund.chain)}.`),
            mkBridge(token, shortfall, remoteFund.chain, dest, `Then land ${token} on ${label(dest)}.`),
          ],
          why: `Swap on ${label(remoteFund.chain)}, then bridge.`,
        })
      }
    }
  }

  return list
}

function swapCandidates(step, assets) {
  const chain = step.chain
  const have = available(assets, step.fromToken, chain)
  const list = []
  if (have + 1e-8 >= step.amount) {
    list.push({ extras: [], why: `${step.fromToken} is already on ${label(chain)}.` })
    return list
  }
  const other = richest(assets, step.fromToken, chain)
  if (other && other.amount + 1e-8 >= step.amount) {
    list.push({
      extras: [mkBridge(step.fromToken, step.amount, other.chain, chain, `${step.fromToken} for this swap lives on ${label(other.chain)}.`)],
      why: `Bridge ${step.fromToken} in, then swap.`,
    })
  }
  return list
}

function bridgeCandidates(step, assets) {
  const have = available(assets, step.token, step.fromChain)
  if (have + 1e-8 >= step.amount) return [{ extras: [], why: `Source balance is sufficient on ${label(step.fromChain)}.` }]
  const other = richest(assets, step.token, step.fromChain)
  if (other && other.amount + 1e-8 >= step.amount) {
    return [{
      extras: [mkBridge(step.token, step.amount, other.chain, step.fromChain, `Relocate ${step.token} from ${label(other.chain)} first.`)],
      why: `Gather ${step.token} onto ${label(step.fromChain)} before the named bridge.`,
    }]
  }
  return [{ extras: [], why: null }]
}

export function routeStep(step, assets, opts = {}) {
  const cands =
    step.kind === 'send' ? sendCandidates(step, assets)
      : step.kind === 'swap' ? swapCandidates(step, assets)
        : step.kind === 'bridge' ? bridgeCandidates(step, assets)
          : []
  if (!cands.length) return { extras: [], why: null, fee: 0 }
  return pick(cands, step, assets, opts.skipBest ? 1 : 0)
}

function pick(cands, step, assets, skip = 0) {
  const scored = []
  for (const c of cands) {
    const s = scorePath(c.extras, step, assets)
    if (!s.ok) continue
    scored.push({ ...c, fee: s.fee })
  }
  scored.sort((a, b) => a.fee - b.fee)
  const chosen = scored[Math.min(skip, scored.length - 1)]
  if (!chosen) return { extras: [], why: null, fee: 0 }
  if (skip && scored[0] && chosen !== scored[0]) {
    chosen.why = `Alternate route (fee $${chosen.fee.toFixed(2)} vs $${scored[0].fee.toFixed(2)} on the cheapest). ${chosen.why || ''}`
  }
  return chosen
}

function trim(n) {
  return Number(Number(n).toPrecision(5))
}
