import { CONTACTS } from '../data/seed.js'
import { analyze, recommend, riskBrief } from './reason.js'
import { totalValue } from './wallet.js'

function nice(n) {
  const v = Number(n)
  if (!Number.isFinite(v) || v <= 0) return 0
  if (v >= 100) return Math.round(v / 10) * 10
  if (v >= 10) return Math.round(v)
  return Number(v.toPrecision(3))
}

function money(n, token = 'USDC') {
  const v = Number(n)
  if (!Number.isFinite(v)) return `0 ${token}`
  if (token === 'USDC') return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  return `${v} ${token}`
}

export function findNamedContact(text) {
  const lower = String(text || '').toLowerCase()
  for (const c of CONTACTS) {
    const first = c.name.split(' ')[0].toLowerCase()
    if (lower.includes(c.name.toLowerCase()) || lower.includes(c.id) || lower.includes(first)) return c
  }
  return null
}

export function counterBid(ask, ctx, stance = 'high') {
  const policies = ctx?.policies || {}
  const remaining = Math.max(0, (policies.dailyCapUsd || 0) - (policies.spentTodayUsd || 0))
  const cap = policies.perTxCapUsd || ask || 0
  if (!ask) {
    const dry = analyze(ctx?.assets || [], policies).stables?.value || 80
    return nice(Math.min(80, dry, remaining || 80))
  }
  const ratio = stance === 'low' ? 1.18 : 0.72
  let bid = ask * ratio
  if (stance !== 'low') {
    if (remaining) bid = Math.min(bid, remaining * 0.85)
    if (cap) bid = Math.min(bid, cap)
    bid = Math.max(bid, Math.min(ask * 0.5, remaining || ask * 0.5))
  } else if (cap) {
    bid = Math.min(bid, cap, remaining || bid)
  }
  return nice(bid)
}

export function bargainOffer(clause, ctx) {
  const prior = ctx?.memory?.bargain || ctx?.pending?.bargain || {}
  const contact = clause.contact || prior.contact || CONTACTS[0]
  const token = clause.token || prior.token || 'USDC'
  const ask = Number(clause.ask || clause.amount || prior.ask || 0) || null
  const stance = clause.stance || prior.stance || 'high'
  const bid = clause.move === 'mid' && ask && prior.bid ? nice((ask + prior.bid) / 2) : counterBid(ask, ctx, stance)
  const mid = ask && bid ? nice((ask + bid) / 2) : bid
  const amount = clause.move === 'mid' ? mid : bid
  const utterance = `send ${amount} ${token} to ${contact.name}`
  const round = (prior.round || 0) + 1
  const first = contact.name.split(' ')[0]
  let message
  if (!ask) {
    message = `${first} is the other party. I bargain for you. Tell me what ${first} wants in ${token}.`
  } else if (stance === 'low') {
    message = `${first} is asking ${money(ask, token)} — light. I bargain for you at ${money(bid, token)}. “Counter” sends our bid. “Take it” pays ${first}. “Meet in the middle” is ${money(mid, token)}.`
  } else {
    message = `${first} is asking ${money(ask, token)}. I bargain for you at ${money(bid, token)}. “Counter” sends our bid to ${first}. “Take it” pays their ask. “Meet in the middle” is ${money(mid, token)}.`
  }
  return {
    type: 'bargain',
    message,
    bargain: {
      contact,
      token,
      ask,
      bid,
      mid,
      amount,
      stance,
      round,
      utterance,
    },
  }
}

export function talkReply(step, ctx) {
  const text = String(step?.topic || step?.raw || '')
  const lower = text.toLowerCase()
  const assets = ctx?.assets || []
  const policies = ctx?.policies || {}
  const who = findNamedContact(text)

  if (/\b(did|identity|passkey|agentic|operator)\b/.test(lower)) {
    return 'The Agentic ID lives on the operator. Passkey controls the signer. The email-and-PIN sleeve only recovers the DID — it does not move funds.'
  }
  if (/\b(bargain|deal|negotiate|counterparty)\b/.test(lower) && who) {
    return `${who.name} is on the desk. Name their ask and I will counter, or say “draft a send to ${who.name.split(' ')[0]}”.`
  }
  if (who && !/\b(pay|send|swap|bridge)\b/.test(lower)) {
    return `${who.name} is on the allowlist. Name an amount and I will draft the send, or tell me their ask if you want to bargain.`
  }
  if (/\b(eth|ether|market|price|bull|bear|volatile|dump|pump)\b/.test(lower)) {
    return `${riskBrief(assets)} ${recommend(assets, policies)} Name a size if you want a draft.`
  }
  if (/\b(usdc|stables?|dry powder|cash)\b/.test(lower)) {
    const a = analyze(assets, policies)
    return `Dry powder is ${money(a.stables.value)}. ${recommend(assets, policies)}`
  }
  if (/\b(cap|policy|guardrail|limit)\b/.test(lower)) {
    return `Daily window ${money(policies.spentTodayUsd || 0)} of ${money(policies.dailyCapUsd || 0)}. Per-tx ${money(policies.perTxCapUsd || 0)}. I will not exceed the mandate.`
  }
  if (/\b(channel|rail|sweep|fund)\b/.test(lower)) {
    return 'Cash channels are USDC rails per chain. Fund Base from Ethereum, or sweep a rail home. Say “show channels”.'
  }
  const nav = totalValue(assets)
  return `Heard. Vault marks at ${money(nav)}. I can draft a move, bargain a counterparty’s ask, or stand watch. Name a person, a size, or an ask.`
}

export function draftUtterance(clause) {
  if (!clause) return ''
  if (clause.kind === 'send' && clause.contact && clause.amount) {
    return `send ${clause.amount} ${clause.token || 'USDC'} to ${clause.contact.name}`
  }
  if (clause.kind === 'swap' && clause.amount) {
    return `swap ${clause.amount} ${clause.fromToken} for ${clause.toToken}`
  }
  if (clause.kind === 'bridge' && clause.amount && clause.toChain) {
    return `bridge ${clause.amount} ${clause.token} to ${clause.toChain}`
  }
  return clause.raw || ''
}
