import { startOfUtcDay } from '../data/seed.js'

export function refreshPolicyWindow(policies) {
  const start = startOfUtcDay()
  if (policies.windowStart !== start) {
    return { ...policies, windowStart: start, spentTodayUsd: 0 }
  }
  return policies
}

function money(n) {
  return `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function evaluateStep(step, quote, policies, contacts) {
  const p = refreshPolicyWindow(policies)
  const reasons = []
  const warnings = []

  if (!step?.ok) {
    return {
      allowed: false,
      needsConfirm: false,
      auto: false,
      reasons: [step?.error || 'Step is not executable'],
      warnings,
      usd: 0,
      policies: p,
    }
  }

  if (step.kind === 'query' || step.kind === 'help' || step.kind === 'watch' || step.kind === 'talk' || step.kind === 'bargain') {
    return { allowed: true, needsConfirm: false, auto: true, reasons, warnings, usd: 0, policies: p }
  }

  if (step.kind === 'policy') {
    return { allowed: true, needsConfirm: true, auto: false, reasons, warnings, usd: 0, policies: p }
  }

  const usd = quote?.usd ?? 0
  const chain = step.chain || step.fromChain || step.toChain

  if (chain && !p.allowedChains.includes(chain)) reasons.push(`${chain} is not an allowed chain`)
  if (step.toChain && !p.allowedChains.includes(step.toChain)) {
    reasons.push(`${step.toChain} is not an allowed destination`)
  }

  if (step.kind === 'send' && step.contact) {
    const known = contacts.some((c) => c.id === step.contact.id || c.address === step.contact.address)
    const allowlisted = p.allowedContacts.includes(step.contact.id)
    if (!known || !allowlisted) {
      if (p.unknownRecipients === 'block') reasons.push(`${step.contact.name} is not on the allowlist`)
      else warnings.push('Recipient is not on the allowlist')
    }
  }

  if (usd > p.perTxCapUsd) reasons.push(`Value ${money(usd)} exceeds per-tx cap of ${money(p.perTxCapUsd)}`)
  if (quote?.insufficient) reasons.push(quote.insufficient)

  const forceConfirm =
    usd >= p.confirmAboveUsd ||
    step.kind === 'rebalance' ||
    step.kind === 'bridge' ||
    step.drafted ||
    (step.kind === 'send' && warnings.length > 0)

  const blocked = reasons.length > 0
  const auto = !blocked && !forceConfirm && usd > 0 && usd <= p.autoExecuteUsd

  return {
    allowed: !blocked,
    needsConfirm: !blocked && (forceConfirm || !auto),
    auto: auto && !blocked,
    reasons,
    warnings,
    usd,
    policies: p,
  }
}

export function evaluatePlan(steps, policies) {
  const p = refreshPolicyWindow(policies)
  const executable = steps.filter((s) => !['query', 'help', 'watch', 'talk', 'bargain'].includes(s.step.kind))
  const usd = executable.reduce((sum, s) => sum + (s.quote?.usd || 0), 0)
  const reasons = []

  if (p.spentTodayUsd + usd > p.dailyCapUsd + 1e-6) {
    reasons.push(`Plan ${money(usd)} would exceed daily cap (${money(p.spentTodayUsd)} used of ${money(p.dailyCapUsd)})`)
  }

  for (const s of steps) {
    if (!s.verdict.allowed) reasons.push(...s.verdict.reasons)
  }

  const anyConfirm = steps.some((s) => s.verdict.needsConfirm)
  const allAuto = steps.length > 0 && steps.every((s) => s.verdict.auto) && reasons.length === 0 && !anyConfirm
  const blocked = reasons.length > 0

  return {
    allowed: !blocked,
    needsConfirm: !blocked && (anyConfirm || !allAuto || executable.length > 1),
    auto: allAuto && executable.length === 1,
    reasons: [...new Set(reasons)],
    usd,
    policies: p,
  }
}

export function applySpend(policies, usd) {
  const p = refreshPolicyWindow(policies)
  return { ...p, spentTodayUsd: p.spentTodayUsd + usd }
}
