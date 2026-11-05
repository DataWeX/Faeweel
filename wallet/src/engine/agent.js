import { HELP } from '../data/seed.js'
import { channelBrief } from './channel.js'
import { bargainOffer, talkReply } from './draft.js'
import { parseUtterance } from './parse.js'
import { applySpend } from './policy.js'
import { buildPlan, isReadOnly } from './plan.js'
import { interpret, recommend, remember, riskBrief, tokenBrief } from './reason.js'
import { activityFromStep, applyStep, fakeHash, totalValue } from './wallet.js'

let seq = 1
function nid(prefix) {
  seq += 1
  return `${prefix}-${Date.now().toString(36)}-${seq}`
}

export function makeUserMessage(text) {
  return { id: nid('m'), role: 'user', text, ts: Date.now() }
}

export function makeAgentMessage(text, extra = {}) {
  return { id: nid('m'), role: 'agent', text, ts: Date.now(), ...extra }
}

export function helpText() {
  return HELP.join(' ')
}

export function portfolioBrief(assets) {
  const total = totalValue(assets)
  const ranked = [...assets].sort((a, b) => b.amount * b.price - a.amount * a.price).slice(0, 3)
  const parts = ranked.map((a) => {
    const w = total ? ((a.amount * a.price) / total) * 100 : 0
    return `${a.symbol} on ${a.chain} (${w.toFixed(0)}%)`
  })
  return `Vault marks at $${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}. Heaviest sleeves: ${parts.join(', ')}.`
}

function queryReply(step, ctx) {
  if (step.kind === 'help') return { text: helpText(), view: null }
  if (step.kind === 'talk') return { text: talkReply(step, ctx), view: null }
  if (step.query === 'portfolio') return { text: `${portfolioBrief(ctx.assets)} ${riskBrief(ctx.assets)}`, view: 'overview' }
  if (step.query === 'activity') return { text: `${ctx.activity.length} journal entries on file.`, view: 'activity' }
  if (step.query === 'policies') {
    const p = ctx.policies
    return {
      text: `Daily cap $${p.dailyCapUsd.toLocaleString()} with $${p.spentTodayUsd.toFixed(0)} used. Per-tx $${p.perTxCapUsd.toLocaleString()}. Auto-exec under $${p.autoExecuteUsd}. Unknown recipients: ${p.unknownRecipients}.`,
      view: 'policies',
    }
  }
  if (step.query === 'token') return { text: tokenBrief(ctx.assets, step.token), view: 'assets' }
  if (step.query === 'risk') return { text: riskBrief(ctx.assets), view: 'overview' }
  if (step.query === 'recommend') return { text: recommend(ctx.assets, ctx.policies), view: 'overview' }
  if (step.query === 'watches') {
    const list = ctx.watches || []
    if (!list.length) return { text: 'No standing watches. Say “watch ETH above 62%”.', view: 'overview' }
    return { text: `Watching ${list.map((w) => w.label).join('; ')}.`, view: 'overview' }
  }
  if (step.query === 'channels') return { text: channelBrief(ctx.assets), view: 'channels' }
  return { text: 'Nothing to report.', view: null }
}

export { interpret, remember }
export { portfolioNote } from './reason.js'

export function propose(raw, ctx) {
  const parsed = parseUtterance(raw)
  if (!parsed.ok) {
    return {
      type: 'error',
      message: `${parsed.error} You can also ask “how much ETH”, “what should I do”, or follow a plan with “why”, “twice”, “on Base”.`,
      plan: null,
    }
  }

  const plan = buildPlan(parsed.clauses, { ...ctx, forceAlt: ctx.forceAlt })
  if (!plan.ok) return { type: 'error', message: plan.error, plan: null }

  const watchSteps = plan.steps.filter((s) => s.step.kind === 'watch')
  if (watchSteps.length) {
    return {
      type: 'watch',
      message: watchSteps.map((s) => `Standing watch armed: ${s.step.watch.label}.`).join(' '),
      watches: watchSteps.map((s) => s.step.watch),
      plan,
      view: 'overview',
    }
  }

  const bargainStep = plan.steps.find((s) => s.step.kind === 'bargain')
  if (bargainStep) {
    const offer = bargainOffer(bargainStep.step, ctx)
    return {
      ...offer,
      plan,
      view: null,
    }
  }

  if (isReadOnly(plan)) {
    const replies = plan.steps.map((s) => queryReply(s.step, ctx))
    return {
      type: 'info',
      message: replies.map((r) => r.text).join(' '),
      view: replies.find((r) => r.view)?.view || null,
      plan,
    }
  }

  const n = plan.steps.filter((s) => s.step.kind !== 'query' && s.step.kind !== 'help').length
  const why = plan.rationale ? ` ${plan.rationale}` : ''

  if (!plan.verdict.allowed) {
    return {
      type: 'blocked',
      message: `Held by policy. ${plan.verdict.reasons[0]}${why} Ask “why” if you want the full chain of thought.`,
      plan,
    }
  }

  const drafted = plan.steps.some((s) => s.step.drafted)
  const autoNote = plan.verdict.auto
    ? 'Within auto-execute. Settling now.'
    : drafted
      ? 'Draft on the blotter. Say “yes” to seal, or void.'
      : 'Awaiting your seal. Say “yes”, “why”, or “void”.'
  return {
    type: 'proposal',
    message: `${n} step${n === 1 ? '' : 's'}. ${plan.title}.${why} ${autoNote}`,
    plan,
  }
}

export function executePlan(plan, ctx) {
  let assets = ctx.assets
  let activity = ctx.activity
  let policies = ctx.policies
  const receipts = []

  for (const unit of plan.steps) {
    const { step, quote } = unit
    if (['query', 'help', 'watch', 'talk', 'bargain'].includes(step.kind)) continue

    if (step.kind === 'policy') {
      policies = { ...policies, [step.field]: step.value }
      receipts.push({ step, hash: null, ok: true })
      continue
    }

    try {
      assets = applyStep(assets, step, quote)
      const hash = fakeHash()
      const rec = activityFromStep(step, quote, hash, plan.raw)
      activity = [rec, ...activity]
      policies = applySpend(policies, quote.usd || 0)
      receipts.push({ step, hash, ok: true, rec })
    } catch (err) {
      return { ok: false, message: err.message || 'Execution failed', receipts, assets, activity, policies }
    }
  }

  const hashes = receipts.map((r) => r.hash).filter(Boolean)
  return {
    ok: true,
    assets,
    activity,
    policies,
    receipts,
    message: hashes.length
      ? `Settled ${receipts.length} step${receipts.length === 1 ? '' : 's'}. ${hashes.join(' · ')}`
      : `Updated. ${plan.title}.`,
  }
}

