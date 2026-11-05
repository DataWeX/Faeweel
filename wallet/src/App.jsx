import { useEffect, useMemo, useRef, useState } from 'react'
import { CONTACTS, FOLLOWUPS, SUGGESTIONS, WALLET } from './data/seed.js'
import { defaultWatches, scanWatches } from './engine/watch.js'
import {
  executePlan,
  helpText,
  interpret,
  makeAgentMessage,
  makeUserMessage,
  portfolioBrief,
  propose,
  remember,
} from './engine/agent.js'
import { freshState, loadState, saveState } from './engine/store.js'
import { driftPrices, totalValue } from './engine/wallet.js'
import { shortAddr, sleep, usd } from './format.js'
import Activity from './views/Activity.jsx'
import AgentPane from './views/AgentPane.jsx'
import CommandDock from './views/CommandDock.jsx'
import Assets from './views/Assets.jsx'
import Channels from './views/Channels.jsx'
import Operator from './views/Operator.jsx'
import Overview from './views/Overview.jsx'
import Policies from './views/Policies.jsx'

const NAV = [
  { id: 'overview', label: 'Overview', idx: '01' },
  { id: 'assets', label: 'Holdings', idx: '02' },
  { id: 'channels', label: 'Channels', idx: '03' },
  { id: 'activity', label: 'Journal', idx: '04' },
  { id: 'policies', label: 'Rules', idx: '05' },
  { id: 'operator', label: 'Operator', idx: '06' },
]

export default function App() {
  const boot = useRef(loadState())
  const seed = boot.current || freshState()

  const [view, setView] = useState('overview')
  const [assets, setAssets] = useState(seed.assets)
  const [activity, setActivity] = useState(seed.activity)
  const [policies, setPolicies] = useState(seed.policies)
  const [messages, setMessages] = useState(() =>
    seed.messages?.length ? seed.messages : [makeAgentMessage(helpText())],
  )
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [toast, setToast] = useState('')
  const [spark, setSpark] = useState(() => Array.from({ length: 18 }, () => 38 + Math.random() * 52))
  const [memory, setMemory] = useState({ lastUtterance: '', lastPlan: null, slots: {} })
  const [watches, setWatches] = useState(() => seed.watches || defaultWatches())
  const [identity, setIdentity] = useState(null)

  const total = useMemo(() => totalValue(assets), [assets])
  const ctx = { assets, activity, policies, contacts: CONTACTS, memory, pending, watches }
  const liveRef = useRef({ assets, policies, watches, pending: null, busy: false })
  liveRef.current = { assets, policies, watches, pending, busy }

  useEffect(() => {
    const t = setInterval(() => {
      setAssets((prev) => driftPrices(prev))
      setSpark((prev) => [...prev.slice(1), Math.max(8, prev[prev.length - 1] + (Math.random() - 0.48) * 12)])
    }, 4000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      const live = liveRef.current
      if (live.busy || live.pending) return
      const scan = scanWatches(live.assets, live.policies, live.watches)
      if (!scan.alerts.length) return
      setWatches(scan.watches)
      const msgs = scan.alerts.map((a) => makeAgentMessage(a.text, { tone: 'warn' }))
      const first = scan.alerts.find((a) => a.remedy)
      if (first?.remedy) {
        const result = propose(first.remedy.utterance, {
          assets: live.assets,
          activity,
          policies: live.policies,
          contacts: CONTACTS,
          watches: scan.watches,
        })
        if (result.type === 'proposal' && result.plan) {
          result.plan.verdict = { ...result.plan.verdict, auto: false }
          setPending(result)
          setMemory((m) => remember(m, first.remedy.utterance, result.plan))
          msgs.push(makeAgentMessage(`${first.remedy.note} Say “do that” to seal, or void.`, { plan: result.plan }))
        }
      }
      setMessages((m) => [...m, ...msgs])
    }, 8000)
    return () => clearInterval(t)
  }, [activity])

  useEffect(() => {
    saveState({ assets, activity, policies, messages, watches })
  }, [assets, activity, policies, messages, watches])

  useEffect(() => {
    fetch('/api/identity')
      .then((r) => r.json())
      .then((d) => {
        if (d?.did) setIdentity(d)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(t)
  }, [toast])

  function push(msg) {
    setMessages((m) => [...m, msg])
  }

  function handleIntent(raw) {
    const text = String(raw || '').trim()
    if (!text || busy) return
    push(makeUserMessage(text))

    const move = interpret(text, { memory, pending, assets, policies })
    if (move.type === 'confirm') {
      if (pending?.bargain?.utterance) {
        const next = propose(pending.bargain.utterance, ctx)
        setMemory((m) => remember(m, pending.bargain.utterance, next.plan, { bargain: null }))
        if (next.type === 'proposal') {
          setPending(next)
          push(makeAgentMessage(next.message, { plan: next.plan }))
          if (next.plan.verdict.auto) settle(next)
        } else {
          push(makeAgentMessage(next.message, { plan: next.plan, tone: next.type === 'blocked' ? 'bad' : undefined }))
        }
        return
      }
      if (pending) settle(pending)
      return
    }
    if (move.type === 'cancel') {
      setPending(null)
      push(makeAgentMessage('Voided. Nothing left the vault.'))
      return
    }
    if (move.type === 'explain') {
      push(makeAgentMessage(move.message))
      return
    }
    if (move.type === 'info') {
      push(makeAgentMessage(move.message))
      return
    }

    const utterance = move.type === 'rewrite' ? move.text : text
    if (move.type === 'rewrite' && move.note) push(makeAgentMessage(move.note))

    const result = propose(utterance, { ...ctx, forceAlt: Boolean(move.forceAlt) })
    setMemory((m) => remember(m, utterance, result.plan, { bargain: result.bargain }))

    if (result.type === 'info') {
      push(makeAgentMessage(result.message, { plan: result.plan }))
      if (result.view) setView(result.view)
      return
    }

    if (result.type === 'bargain') {
      setPending(result)
      push(makeAgentMessage(result.message, { plan: result.plan, bargain: result.bargain }))
      return
    }

    if (result.type === 'watch') {
      setWatches((prev) => [...result.watches, ...prev])
      push(makeAgentMessage(result.message, { plan: result.plan }))
      setView('overview')
      setToast('Watch armed')
      return
    }

    if (result.type === 'error') {
      push(makeAgentMessage(result.message, { tone: 'bad' }))
      return
    }

    if (result.type === 'blocked') {
      push(makeAgentMessage(result.message, { tone: 'bad', plan: result.plan }))
      setView('policies')
      return
    }

    setPending(result)
    push(makeAgentMessage(result.message, { plan: result.plan }))
    if (result.plan.verdict.auto) settle(result)
  }

  async function settle(proposal) {
    const plan = proposal.plan
    setBusy(true)
    setPending(proposal)
    setProgress({ index: 0, ok: true })

    const live = { assets, activity, policies }
    for (let i = 0; i < plan.steps.length; i++) {
      setProgress({ index: i, ok: true })
      await sleep(420)
      const slice = { ...plan, steps: [plan.steps[i]] }
      const res = executePlan(slice, live)
      if (!res.ok) {
        setProgress({ index: i, ok: false })
        setBusy(false)
        push(makeAgentMessage(res.message, { tone: 'bad', plan }))
        setPending(null)
        return
      }
      live.assets = res.assets
      live.activity = res.activity
      live.policies = res.policies
      setAssets(res.assets)
      setActivity(res.activity)
      setPolicies(res.policies)
    }

    setProgress({ index: plan.steps.length, ok: true })
    await sleep(180)
    setBusy(false)
    setPending(null)
    push(makeAgentMessage(`Sealed. ${plan.title}.`, { tone: 'ok' }))
    setToast(plan.verdict.auto ? 'Auto-executed within policy' : 'Plan sealed')
    const kinds = plan.steps.map((s) => s.step.kind)
    if (kinds.includes('policy') && kinds.every((k) => k === 'policy' || k === 'query' || k === 'help')) {
      setView('policies')
    } else {
      setView('activity')
    }
  }

  function updatePolicy(patch) {
    setPolicies((p) => ({ ...p, ...patch }))
    setToast('Rule saved')
  }

  return (
    <div className="app">
      <header className="mast">
        <div className="wordmark">
          <strong>
            Ae<i>ther</i>
          </strong>
          <span>Agentic vault</span>
        </div>
        <div className="mast-meta">
          <div className="seal">
            <span className={busy ? 'live pulse' : pending ? 'live brass' : 'live'} />
            {busy ? 'Settling' : pending?.bargain ? `Bargain · ${pending.bargain.contact?.name?.split(' ')[0]}` : pending ? 'Awaiting seal' : 'Clerk live'}
          </div>
          <div className="seal mono" title={WALLET.address}>
            {WALLET.name} · {shortAddr(WALLET.address)}
          </div>
          <div className="seal">{usd(total)}</div>
        </div>
      </header>

      <nav className="rail">
        <div className="rail-k">Folio</div>
        {NAV.map((n) => (
          <button key={n.id} className={view === n.id ? 'on' : ''} onClick={() => setView(n.id)}>
            <span className="lab">{n.label}</span>
            <span className="idx">{n.idx}</span>
          </button>
        ))}
        <div className="rail-note">
          Speak from the dock. The clerk reacts, bargains, and drafts. Policy still binds every seal.
        </div>
      </nav>

      <main className="stage">
        {view === 'overview' && (
          <Overview
            assets={assets}
            total={total}
            activity={activity}
            policies={policies}
            spark={spark}
            brief={portfolioBrief(assets)}
            watches={watches}
            identity={identity}
            onAsk={handleIntent}
            onOpenId={() => setView('operator')}
            onDropWatch={(id) => setWatches((w) => w.filter((x) => x.id !== id))}
          />
        )}
        {view === 'assets' && <Assets assets={assets} total={total} onAsk={handleIntent} />}
        {view === 'channels' && <Channels assets={assets} onAsk={handleIntent} />}
        {view === 'activity' && <Activity activity={activity} />}
        {view === 'policies' && <Policies policies={policies} contacts={CONTACTS} onChange={updatePolicy} />}
        {view === 'operator' && <Operator />}
      </main>

      <AgentPane
        messages={messages}
        pending={pending}
        busy={busy}
        progress={progress}
        onConfirm={() => {
          if (pending?.bargain) handleIntent('counter')
          else if (pending) settle(pending)
        }}
        onCancel={() => {
          setPending(null)
          push(makeAgentMessage('Voided. Nothing left the vault.'))
        }}
      />

      <CommandDock
        pending={pending}
        busy={busy}
        suggestions={pending?.bargain ? ['take it', 'meet in the middle', 'counter', 'void'] : pending ? FOLLOWUPS : SUGGESTIONS}
        onSubmit={handleIntent}
        onConfirm={() => {
          if (pending?.bargain) handleIntent('counter')
          else if (pending) settle(pending)
        }}
        onCancel={() => {
          setPending(null)
          push(makeAgentMessage('Voided. Nothing left the vault.'))
        }}
      />

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
