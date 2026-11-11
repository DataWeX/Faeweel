import { CHAINS } from '../data/seed.js'
import { evaluatePlan, evaluateStep } from './policy.js'
import { routeStep } from './route.js'
import { applyStep, available, cloneAssets, quoteStep } from './wallet.js'

export function buildPlan(clauses, ctx) {
  const steps = []
  let sim = cloneAssets(ctx.assets)
  let policies = ctx.policies
  const notes = []

  for (const clause of clauses) {
    if (!clause.ok) return { ok: false, error: clause.error, steps: [] }

    if (clause.kind === 'query' || clause.kind === 'help' || clause.kind === 'watch' || clause.kind === 'talk' || clause.kind === 'bargain') {
      const quote = { usd: 0 }
      const verdict = evaluateStep(clause, quote, policies, ctx.contacts)
      steps.push({ step: clause, quote, verdict })
      continue
    }

    if (clause.kind === 'sweep') {
      const have = available(sim, 'USDC', clause.fromChain)
      const amt = clause.amount || have
      if (!amt) {
        return { ok: false, error: `No USDC on ${CHAINS[clause.fromChain]?.name || clause.fromChain} to sweep.`, steps: [] }
      }
      clause = {
        ok: true,
        kind: 'bridge',
        token: 'USDC',
        amount: amt,
        fromChain: clause.fromChain,
        toChain: clause.toChain || 'ethereum',
        raw: clause.raw,
        summary: `Sweep ${amt} USDC from ${CHAINS[clause.fromChain]?.name || clause.fromChain} home`,
      }
    }

    const routed = routeStep(clause, sim, { skipBest: ctx.forceAlt })
    if (routed.why) notes.push(routed.why)
    const extras = routed.extras || []

    for (const unit of [...extras, clause]) {
      if (!unit.why && routed.why && unit === clause) unit.why = routed.why
      const quote = quoteStep(unit, sim)
      const verdict = evaluateStep(unit, quote, policies, ctx.contacts)
      steps.push({ step: unit, quote, verdict })
      if (verdict.allowed && unit.kind !== 'policy' && !quote.insufficient) {
        try {
          sim = applyStep(sim, unit, quote)
        } catch {
          /* quote already captured insufficiency */
        }
      }
      if (unit.kind === 'policy') policies = { ...policies, [unit.field]: unit.value }
    }
  }

  const planVerdict = evaluatePlan(steps, ctx.policies)
  const title = steps.map((s) => s.step.summary).filter(Boolean).join(' → ')
  const rationale = notes.filter(Boolean).join(' ') || defaultRationale(steps)
  return {
    ok: true,
    steps,
    verdict: planVerdict,
    title,
    rationale,
    raw: clauses.map((c) => c.raw).join(' then '),
  }
}

function defaultRationale(steps) {
  const exec = steps.filter((s) => s.step.kind !== 'query' && s.step.kind !== 'help')
  if (!exec.length) return ''
  if (exec.length === 1) return 'Single-leg plan. Quoted against live marks and bound to the day window.'
  return `${exec.length} legs. Each hop is simulated against the vault before the next is quoted.`
}

export function isReadOnly(plan) {
  return plan.steps.every((s) => ['query', 'help', 'watch', 'talk', 'bargain'].includes(s.step.kind))
}
