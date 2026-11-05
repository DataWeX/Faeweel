import { parseUtterance } from './parse.js'
import { CONTACTS, initialAssets, initialPolicies } from '../data/seed.js'
import { buildPlan } from './plan.js'
import { executePlan } from './agent.js'
import { interpret, remember } from './reason.js'
import { bargainOffer } from './draft.js'
import { propose } from './agent.js'

const cases = [
  ['Pay Alice 80 USDC', 'send'],
  ['Swap 0.4 ETH for USDC on Base', 'swap'],
  ['What is my exposure?', 'query'],
  ['Set daily cap to 3000', 'policy'],
  ['Bridge 0.5 ETH to Base', 'bridge'],
  ['Rebalance to 50% ETH', 'rebalance'],
  ['Stake 1 ETH', 'stake'],
]

let failed = 0
for (const [raw, kind] of cases) {
  const r = parseUtterance(raw)
  const ok = r.ok && r.clauses[0]?.kind === kind
  if (!ok) {
    failed += 1
    console.error('FAIL parse', raw, r)
  } else console.log('OK parse', raw)
}

const compound = parseUtterance('Bridge 0.4 ETH to Base then send 0.2 ETH to Alice')
if (!compound.ok || compound.clauses.length !== 2) {
  failed += 1
  console.error('FAIL compound', compound)
} else console.log('OK compound', compound.clauses.map((c) => c.kind).join(' → '))

const ctx = {
  assets: initialAssets(),
  activity: [],
  policies: initialPolicies(),
  contacts: CONTACTS,
}

const poor = {
  ...ctx,
  assets: ctx.assets.map((a) => (a.symbol === 'USDC' ? { ...a, amount: 10 } : a)),
}
const funded = parseUtterance('Pay Treasury 200 USDC from ETH')
const plan = buildPlan(funded.clauses, poor)
if (!plan.ok || plan.steps.length < 2 || plan.steps[0].step.kind !== 'swap') {
  failed += 1
  console.error('FAIL fund plan', JSON.stringify(plan, null, 2))
} else console.log('OK fund', plan.title)

const pay = parseUtterance('Pay Alice 80 USDC')
const p2 = buildPlan(pay.clauses, ctx)
const exec = executePlan(p2, ctx)
if (!exec.ok) {
  failed += 1
  console.error('FAIL exec', exec)
} else console.log('OK exec', exec.message)

const how = parseUtterance('How much ETH do I have?')
if (!how.ok || how.clauses[0]?.query !== 'token') {
  failed += 1
  console.error('FAIL how much', how)
} else console.log('OK how much ETH')

const rec = parseUtterance('What should I do?')
if (!rec.ok || rec.clauses[0]?.query !== 'recommend') {
  failed += 1
  console.error('FAIL recommend', rec)
} else console.log('OK recommend')

const dollar = parseUtterance('Pay Alice $80')
if (!dollar.ok || dollar.clauses[0]?.token !== 'USDC' || dollar.clauses[0]?.amount !== 80) {
  failed += 1
  console.error('FAIL dollar', dollar)
} else console.log('OK dollar send')

const onBase = parseUtterance('Send 0.4 ETH to Alice on Base')
const thin = {
  ...ctx,
  assets: ctx.assets.map((a) => (a.id === 'eth-base' ? { ...a, amount: 0.05 } : a)),
}
const routed = buildPlan(onBase.clauses, thin)
if (!routed.ok || routed.steps[0].step.kind !== 'bridge') {
  failed += 1
  console.error('FAIL route', routed.steps.map((s) => s.step.kind), routed)
} else console.log('OK route', routed.title)

const mem = remember({}, 'Pay Alice 80 USDC', p2)
const twice = interpret('twice', { memory: mem, pending: null })
if (twice.type !== 'rewrite' || !String(twice.text).includes('160')) {
  failed += 1
  console.error('FAIL twice', twice, mem)
} else console.log('OK twice', twice.text)

const yes = interpret('yes', { memory: mem, pending: { plan: p2 } })
if (yes.type !== 'confirm') {
  failed += 1
  console.error('FAIL yes', yes)
} else console.log('OK yes')

const watch = parseUtterance('Watch ETH above 62%')
if (!watch.ok || watch.clauses[0]?.kind !== 'watch' || watch.clauses[0]?.watch?.value !== 62) {
  failed += 1
  console.error('FAIL watch', watch)
} else console.log('OK watch', watch.clauses[0].watch.label)

const doThat = interpret('i want to do that', { memory: mem, pending: { plan: p2 } })
if (doThat.type !== 'confirm') {
  failed += 1
  console.error('FAIL do that', doThat)
} else console.log('OK do that')

const doIdle = interpret('i want to do that', { memory: mem, pending: null, assets: ctx.assets, policies: ctx.policies })
if (doIdle.type !== 'rewrite') {
  failed += 1
  console.error('FAIL do idle', doIdle)
} else console.log('OK do idle', doIdle.text)

const cheaper = interpret('cheaper', { memory: mem, pending: null })
if (cheaper.type !== 'rewrite' || !cheaper.forceAlt) {
  failed += 1
  console.error('FAIL cheaper', cheaper)
} else console.log('OK cheaper')

const rails = parseUtterance('Show channels')
if (!rails.ok || rails.clauses[0]?.query !== 'channels') {
  failed += 1
  console.error('FAIL channels', rails)
} else console.log('OK channels')

const fund = parseUtterance('Fund Base 500')
if (!fund.ok || fund.clauses[0]?.kind !== 'bridge' || fund.clauses[0]?.toChain !== 'base' || fund.clauses[0]?.amount !== 500) {
  failed += 1
  console.error('FAIL fund channel', fund)
} else console.log('OK fund channel')

const sweep = parseUtterance('Sweep Base')
if (!sweep.ok || sweep.clauses[0]?.kind !== 'sweep' || sweep.clauses[0]?.fromChain !== 'base') {
  failed += 1
  console.error('FAIL sweep', sweep)
} else console.log('OK sweep')

const talk = parseUtterance('the market looks heavy today')
if (!talk.ok || talk.clauses[0]?.kind !== 'talk') {
  failed += 1
  console.error('FAIL talk', talk)
} else console.log('OK talk')

const drafted = parseUtterance('Draft a send of 50 USDC to Alice')
if (!drafted.ok || drafted.clauses[0]?.kind !== 'send' || drafted.clauses[0]?.amount !== 50) {
  failed += 1
  console.error('FAIL draft', drafted)
} else console.log('OK draft', drafted.clauses[0].summary)

const bargained = parseUtterance('Bargain with Alice on 400 USDC')
if (!bargained.ok || bargained.clauses[0]?.kind !== 'bargain' || bargained.clauses[0]?.ask !== 400) {
  failed += 1
  console.error('FAIL bargain parse', bargained)
} else console.log('OK bargain parse')

const offer = bargainOffer(bargained.clauses[0], ctx)
if (offer.type !== 'bargain' || !(offer.bargain.bid < 400) || !offer.bargain.utterance.includes('Alice')) {
  failed += 1
  console.error('FAIL bargain offer', offer)
} else console.log('OK bargain offer', offer.bargain.bid)

const proposed = propose('Bargain with Alice on 400 USDC', ctx)
if (proposed.type !== 'bargain' || !proposed.bargain?.bid) {
  failed += 1
  console.error('FAIL propose bargain', proposed)
} else console.log('OK propose bargain')

const take = interpret('take it', { memory: { bargain: offer.bargain }, pending: { bargain: offer.bargain } })
if (take.type !== 'rewrite' || !String(take.text).includes('400')) {
  failed += 1
  console.error('FAIL take it', take)
} else console.log('OK take it', take.text)

const mid = interpret('meet in the middle', { memory: { bargain: offer.bargain }, pending: { bargain: offer.bargain } })
if (mid.type !== 'rewrite' || !/bargain/.test(mid.text)) {
  failed += 1
  console.error('FAIL mid', mid)
} else console.log('OK mid', mid.text)

if (failed) process.exit(1)
console.log('all passed')
