import { useEffect, useRef } from 'react'
import { CHAINS } from '../data/seed.js'
import { tokenAmt, usd } from '../format.js'

function stepMeta(unit) {
  const { step, quote } = unit
  const bits = []
  if (step.kind === 'send') bits.push(`${tokenAmt(step.amount)} ${step.token} → ${step.contact?.name}`)
  if (step.kind === 'swap') bits.push(`${tokenAmt(step.amount)} ${step.fromToken} → ${tokenAmt(quote.toAmount)} ${step.toToken}`)
  if (step.kind === 'bridge') {
    bits.push(`${tokenAmt(step.amount)} ${step.token} ${CHAINS[step.fromChain]?.short} → ${CHAINS[step.toChain]?.short}`)
  }
  if (step.kind === 'rebalance') bits.push(`${step.percent}% ${step.token}`)
  if (step.kind === 'stake' || step.kind === 'unstake') bits.push(`${tokenAmt(step.amount)} ${step.token}`)
  if (step.kind === 'policy') bits.push(step.summary)
  if (quote?.usd) bits.push(usd(quote.usd))
  if (quote?.feeUsd) bits.push(`fee ${usd(quote.feeUsd)}`)
  if (unit.verdict?.auto) bits.push('auto')
  return bits.filter(Boolean).join(' · ')
}

export default function AgentPane({
  messages,
  pending,
  busy,
  progress,
  onConfirm,
  onCancel,
}) {
  const scroller = useRef(null)

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, pending, progress])

  return (
    <aside className="blotter">
      <div className="blotter-h">
        <h2>Clerk</h2>
        <p>Speak from the dock below. I react, bargain, draft, then stand watch.</p>
      </div>
      <div className="thread" ref={scroller}>
        {messages.map((m) => (
          <div className={`msg ${m.role}`} key={m.id}>
            <div className="who">{m.role === 'user' ? 'You' : 'Aether'}</div>
            <div>{m.text}</div>
            {m.bargain && pending?.bargain === m.bargain ? (
              <BargainCard bargain={pending.bargain} onConfirm={onConfirm} onCancel={onCancel} busy={busy} />
            ) : m.plan && pending && m.plan === pending.plan ? (
              <Ticket plan={pending.plan} type={pending.type} busy={busy} progress={progress} onConfirm={onConfirm} onCancel={onCancel} />
            ) : m.plan && !pending ? (
              <Ticket plan={m.plan} type={m.tone === 'bad' ? 'blocked' : 'done'} busy={false} progress={progress} />
            ) : null}
          </div>
        ))}
        {busy ? (
          <div className="working" aria-live="polite">
            <span />
            <span />
            <span />
            Settling the plan
          </div>
        ) : null}
      </div>
    </aside>
  )
}

function BargainCard({ bargain, onConfirm, onCancel, busy }) {
  const them = bargain.contact?.name?.split(' ')[0] || 'Them'
  return (
    <div className="ticket bargain">
      <div className="ticket-top">
        <div>
          <div className="kicker">Open bargain</div>
          <h4>You vs {them}</h4>
        </div>
        <span className="tag warn">Round {bargain.round || 1}</span>
      </div>
      <p className="mute bargain-note">
        {them} is the other party. The clerk bargains for you. Nothing leaves the vault until you seal.
      </p>
      <div className="sides">
        <div className="side them">
          <div className="mute">Them · {them}</div>
          <div className="spread-fig">{bargain.ask ? usd(bargain.ask) : '—'}</div>
          <div className="mute">asking</div>
        </div>
        <div className="side mid">
          <div className="mute">Middle</div>
          <div className="spread-fig brass">{bargain.mid ? usd(bargain.mid) : '—'}</div>
          <div className="mute">split</div>
        </div>
        <div className="side us">
          <div className="mute">You · desk</div>
          <div className="spread-fig moss">{usd(bargain.bid)}</div>
          <div className="mute">our bid</div>
        </div>
      </div>
      {onConfirm ? (
        <div className="actions">
          <button className="btn primary" type="button" onClick={onConfirm} disabled={busy}>
            Send our bid
          </button>
          <button className="btn ghost" type="button" onClick={onCancel} disabled={busy}>
            Void
          </button>
        </div>
      ) : null}
    </div>
  )
}

function Ticket({ plan, type, busy, progress, onConfirm, onCancel }) {
  const blocked = type === 'blocked'
  const done = type === 'done'
  const drafted = plan.steps?.some((s) => s.step.drafted)
  return (
    <div className={`ticket ${drafted ? 'draft' : ''}`}>
      <div className="ticket-top">
        <h4>{plan.title}</h4>
        {drafted && !done ? <span className="tag warn">Draft</span> : null}
        {blocked ? <span className="tag bad">Held</span> : null}
        {done ? <span className="tag ok">Sealed</span> : null}
      </div>
      {plan.rationale ? <p className="mute" style={{ marginBottom: 10, lineHeight: 1.5 }}>{plan.rationale}</p> : null}
      {plan.steps.map((unit, i) => {
        let cls = ''
        if (progress && progress.index === i) cls = progress.ok === false ? 'fail' : 'on'
        if (progress && progress.index > i) cls = 'done'
        if (done) cls = 'done'
        return (
          <div className={`step ${cls}`} key={`${unit.step.kind}-${i}`}>
            <div className="n">{String(i + 1).padStart(2, '0')}</div>
            <div>
              <div>{unit.step.summary}</div>
              <div className="mute">{stepMeta(unit)}</div>
              {unit.step.why ? <div className="mute">{unit.step.why}</div> : null}
              {unit.verdict?.reasons?.length ? (
                <div className="mute" style={{ color: '#c47a72' }}>
                  {unit.verdict.reasons.join(' · ')}
                </div>
              ) : null}
            </div>
          </div>
        )
      })}
      <div className="kv">
        <span>Notional</span>
        <span>{usd(plan.verdict.usd)}</span>
        <span>Path</span>
        <span>{blocked ? 'Held' : plan.verdict.auto ? 'Auto-execute' : 'Needs seal'}</span>
      </div>
      {plan.verdict.reasons?.length && blocked ? (
        <div className="mute" style={{ color: '#c47a72', marginBottom: 8 }}>
          {plan.verdict.reasons.join(' · ')}
        </div>
      ) : null}
      {!blocked && !done && onConfirm ? (
        <div className="actions">
          <button className="btn primary" onClick={onConfirm} disabled={busy}>
            Seal plan
          </button>
          <button className="btn ghost" onClick={onCancel} disabled={busy}>
            Void
          </button>
        </div>
      ) : null}
    </div>
  )
}
