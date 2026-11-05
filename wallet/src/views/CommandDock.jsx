import { useState } from 'react'
import { usd } from '../format.js'

export default function CommandDock({ pending, busy, suggestions, onSubmit, onConfirm, onCancel }) {
  const [text, setText] = useState('')

  function submit(e) {
    e.preventDefault()
    const v = text.trim()
    if (!v) return
    onSubmit(v)
    setText('')
  }

  return (
    <footer className="dock">
      <div className="dock-meta">
        <div className="kicker">{pending?.bargain ? 'Bargain' : pending?.plan ? 'Seal' : 'Speak'}</div>
        {pending?.bargain ? (
          <div className="dock-pending">
            <span className="tag warn">You vs {pending.bargain.contact?.name?.split(' ')[0]}</span>
            <span className="mute">they {usd(pending.bargain.ask)}</span>
            <span className="mute">we {usd(pending.bargain.bid)}</span>
          </div>
        ) : pending?.plan ? (
          <div className="dock-pending">
            <span className="tag warn">Awaiting seal</span>
            <span className="mute">{pending.plan.title}</span>
            <span className="mute">{usd(pending.plan.verdict?.usd)}</span>
          </div>
        ) : (
          <div className="mute">Idle clerk. Name a move, an ask, or a draft.</div>
        )}
      </div>
      <div className="dock-body">
        <div className="chips">
          {suggestions.map((s) => (
            <button key={s} className="chip" type="button" onClick={() => onSubmit(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="dock-form">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              pending?.bargain
                ? 'take it · meet in the middle · or name a figure'
                : pending?.plan
                  ? 'yes · why · twice · void'
                  : 'Pay Alice 80 USDC — or bargain, draft, ask'
            }
            aria-label="Intent"
            disabled={busy}
            autoComplete="off"
          />
          <button className="btn primary" type="submit" disabled={busy}>
            Speak
          </button>
          {pending ? (
            <>
              <button className="btn primary" type="button" onClick={onConfirm} disabled={busy}>
                {pending.bargain ? 'Counter' : 'Seal'}
              </button>
              <button className="btn ghost" type="button" onClick={onCancel} disabled={busy}>
                Void
              </button>
            </>
          ) : null}
        </form>
      </div>
    </footer>
  )
}
