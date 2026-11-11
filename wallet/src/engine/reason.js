import { CHAINS } from '../data/seed.js'
import { bySymbol, totalValue } from './wallet.js'

export function analyze(assets, policies) {
  const total = totalValue(assets)
  const symbols = bySymbol(assets)
  const top = symbols[0] || null
  const stables = symbols.find((s) => s.symbol === 'USDC') || { value: 0, amount: 0, symbol: 'USDC' }
  const eth = symbols.find((s) => s.symbol === 'ETH')
  const concentration = top && total ? top.value / total : 0
  const remaining = Math.max(0, (policies?.dailyCapUsd || 0) - (policies?.spentTodayUsd || 0))
  const warnings = []
  if (concentration > 0.62 && top) {
    warnings.push(`${top.symbol} is ${(concentration * 100).toFixed(0)}% of NAV — concentrated.`)
  }
  if (total && stables.value / total < 0.1) warnings.push('Dry powder is thin relative to NAV.')
  if (policies && remaining < 600) warnings.push(`Only $${remaining.toFixed(0)} remains on today’s cap.`)
  return { total, symbols, top, stables, eth, concentration, remaining, warnings }
}

export function tokenBrief(assets, symbol) {
  const rows = assets.filter((a) => a.symbol === symbol)
  if (!rows.length) return `No ${symbol} on the books.`
  const amount = rows.reduce((s, a) => s + a.amount, 0)
  const value = rows.reduce((s, a) => s + a.amount * a.price, 0)
  const bits = rows.map((a) => `${trim(a.amount)} on ${CHAINS[a.chain]?.name || a.chain}`)
  return `${trim(amount)} ${symbol} ($${Math.round(value).toLocaleString()}) · ${bits.join('; ')}.`
}

export function riskBrief(assets) {
  const a = analyze(assets, {})
  if (!a.top) return 'Empty vault.'
  return `Largest sleeve is ${a.top.symbol} at ${(a.concentration * 100).toFixed(0)}% of NAV. Stables ${((a.stables.value / a.total) * 100).toFixed(0)}%.`
}

export function recommendedMove(assets, policies) {
  const a = analyze(assets, policies)
  if (a.eth && a.total) {
    const w = a.eth.value / a.total
    if (w > 0.58 || w < 0.45) return 'Rebalance to 55% ETH'
  }
  if (a.stables.value > 18000) return 'Pay Alice 80 USDC'
  if (a.remaining < 1000) return `Set daily cap to ${Math.round((policies?.dailyCapUsd || 5000) * 1.25)}`
  return 'Swap 0.2 ETH for USDC on Base'
}

export function recommend(assets, policies) {
  const a = analyze(assets, policies)
  const notes = []
  if (a.eth && a.total) {
    const w = a.eth.value / a.total
    if (w > 0.58) notes.push(`ETH is ${(w * 100).toFixed(0)}% of NAV. A rebalance toward 55% would sell about $${Math.round(a.eth.value - a.total * 0.55).toLocaleString()} into USDC.`)
    else if (w < 0.45) notes.push(`ETH is light at ${(w * 100).toFixed(0)}%. Buying the 55% sleeve would cost about $${Math.round(a.total * 0.55 - a.eth.value).toLocaleString()}.`)
  }
  if (a.stables.value > 20000) notes.push(`USDC dry powder is $${Math.round(a.stables.value).toLocaleString()} — enough to fund studio payments without selling beta.`)
  if (a.remaining < 1000) notes.push(`Daily window is nearly spent (${usd0(a.remaining)} left). Keep tickets small or raise the cap.`)
  if (!notes.length) notes.push('Sleeves look balanced. Idle USDC can wait; no forced move.')
  return notes.join(' ')
}

export function explainPlan(plan) {
  if (!plan) return 'No plan on the blotter yet.'
  const lines = []
  if (plan.rationale) lines.push(plan.rationale)
  for (const u of plan.steps) {
    if (u.step.why) lines.push(`${u.step.summary} — ${u.step.why}`)
  }
  if (plan.verdict?.reasons?.length) lines.push(`Held: ${plan.verdict.reasons.join('; ')}.`)
  if (!lines.length) lines.push(plan.title || 'That plan has no extra commentary.')
  return lines.join(' ')
}

export function interpret(raw, ctx) {
  const text = String(raw || '').trim()
  const lower = text.toLowerCase()
  const memory = ctx.memory || {}
  const pending = ctx.pending

  if (
    /^(yes|yep|yeah|ok|okay|do it|do that|seal( it)?|confirm|go|execute|proceed|approved)$/i.test(text)
    || /\b(do that|do it|seal it|i want to do that|let'?s do (it|that))\b/i.test(text)
  ) {
    if (pending) return { type: 'confirm' }
    const move = recommendedMove(ctx.assets, ctx.policies)
    if (move) {
      return { type: 'rewrite', text: move, note: `Nothing was pending, so I drafted the desk’s next move: ${move}.` }
    }
    return { type: 'info', message: 'Nothing is awaiting a seal, and the vault needs no forced move.' }
  }
  if (/^(no|nope|cancel|void|nevermind|never mind|stop|abort)$/i.test(text)) {
    return pending ? { type: 'cancel' } : { type: 'info', message: 'Nothing to void.' }
  }
  if (/^(why|explain|rationale|why this|why that)\b/i.test(text)) {
    return { type: 'explain', message: explainPlan(pending?.plan || memory.lastPlan) }
  }
  if (/^(again|retry|same|do that again|once more)$/i.test(text) && memory.lastUtterance) {
    return { type: 'rewrite', text: memory.lastUtterance, note: 'Replaying the last intent.' }
  }
  if (/^(twice|double (it|that))$/i.test(text) && memory.lastUtterance && memory.slots?.amount) {
    return {
      type: 'rewrite',
      text: replaceAmount(memory.lastUtterance, memory.slots.amount, memory.slots.amount * 2),
      note: 'Doubled the last amount.',
    }
  }
  if (/^(half|half that)$/i.test(text) && memory.lastUtterance && memory.slots?.amount) {
    return {
      type: 'rewrite',
      text: replaceAmount(memory.lastUtterance, memory.slots.amount, memory.slots.amount / 2),
      note: 'Halved the last amount.',
    }
  }

  const onChain = lower.match(/^on (ethereum|mainnet|base|arbitrum|arb|optimism|op|solana|sol)$/)
  if (onChain && memory.lastUtterance) {
    const cleaned = memory.lastUtterance.replace(/\bon (ethereum|mainnet|base|arbitrum|arb|optimism|op|solana|sol)\b/gi, '').trim()
    return { type: 'rewrite', text: `${cleaned} on ${onChain[1]}`, note: `Rerouted onto ${onChain[1]}.` }
  }

  const toWho = text.match(/^to ([A-Za-z]+)$/i)
  if (toWho && memory.slots?.amount && memory.slots?.token) {
    return {
      type: 'rewrite',
      text: `send ${memory.slots.amount} ${memory.slots.token} to ${toWho[1]}`,
      note: `Kept ${memory.slots.amount} ${memory.slots.token}, changed recipient.`,
    }
  }

  if (/^(cheaper|another route|better route|other way|alternate)$/i.test(lower) && memory.lastUtterance) {
    return { type: 'rewrite', text: memory.lastUtterance, note: 'Replanning on the next-best route.', forceAlt: true }
  }

  const bargain = pending?.bargain || memory.bargain
  if (bargain) {
    if (/^(take it|pay the ask|accept( their ask)?)$/i.test(text) && bargain.ask) {
      return {
        type: 'rewrite',
        text: `send ${bargain.ask} ${bargain.token} to ${bargain.contact.name}`,
        note: `Taking ${bargain.contact.name}’s ask of ${bargain.ask} ${bargain.token}.`,
      }
    }
    if (/^(meet in the middle|split( the difference)?|mid)$/i.test(text) && bargain.ask && bargain.bid) {
      return {
        type: 'rewrite',
        text: `bargain with ${bargain.contact.name} on ${bargain.ask} ${bargain.token}, meet in the middle`,
        note: 'Splitting the difference.',
      }
    }
    if (/^(counter|your bid|send the bid|seal the counter)$/i.test(text) && bargain.utterance) {
      return { type: 'rewrite', text: bargain.utterance, note: `Sending the desk’s counter of ${bargain.bid} ${bargain.token}.` }
    }
    const figure = text.match(/^(?:make it |try |offer |bid )?\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:usdc|usd)?$/i)
    if (figure) {
      const n = Number(String(figure[1]).replace(/,/g, ''))
      return {
        type: 'rewrite',
        text: `bargain with ${bargain.contact.name} on ${n} ${bargain.token}`,
        note: `Rebidding at ${n} ${bargain.token}.`,
      }
    }
  }

  return { type: 'pass', text }
}

export function remember(memory, utterance, plan, extra = {}) {
  const slots = { ...(memory?.slots || {}) }
  const step = plan?.steps?.find((s) => !s.step.synthetic && s.step.kind !== 'query' && s.step.kind !== 'help')?.step
    || plan?.steps?.[0]?.step
  if (step) {
    if (step.amount) slots.amount = step.amount
    if (step.token) slots.token = step.token
    if (step.fromToken) slots.token = step.fromToken
    if (step.contact) slots.contact = step.contact
    if (step.chain) slots.chain = step.chain
    if (step.toChain) slots.chain = step.toChain
    slots.kind = step.kind
  }
  return {
    lastUtterance: utterance,
    lastPlan: plan || memory?.lastPlan || null,
    slots,
    bargain: extra.bargain || memory?.bargain || null,
  }
}

function replaceAmount(text, oldAmt, next) {
  const n = Number(Number(next).toPrecision(6))
  const re = new RegExp(String(oldAmt).replace('.', '\\.'))
  if (re.test(text)) return text.replace(re, String(n))
  return text.replace(/\b([0-9][0-9,]*(?:\.[0-9]+)?)\b/, String(n))
}

function trim(n) {
  return Number(n.toPrecision(6))
}

function usd0(n) {
  return `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function portfolioNote(assets, policies) {
  const a = analyze(assets, policies)
  if (a.warnings[0]) return a.warnings[0]
  if (a.eth && a.total) {
    const w = (a.eth.value / a.total) * 100
    return `ETH sleeve ${w.toFixed(0)}% · stables ${((a.stables.value / a.total) * 100).toFixed(0)}% · ${usd0(a.remaining)} left today.`
  }
  return 'Ledger is quiet.'
}
