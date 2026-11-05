import { CHAINS } from '../data/seed.js'
import { timeAgo, tokenAmt } from '../format.js'

function line(e) {
  if (e.kind === 'swap') return `${tokenAmt(e.fromAmount)} ${e.fromSymbol} → ${tokenAmt(e.toAmount)} ${e.toSymbol}`
  if (e.kind === 'bridge') {
    return `${tokenAmt(e.amount)} ${e.symbol} · ${CHAINS[e.fromChain]?.short} → ${CHAINS[e.toChain]?.short}`
  }
  if (e.kind === 'rebalance') return `Target ${e.amount}% ${e.symbol}`
  if (e.kind === 'policy') return `Rule updated`
  if (e.amount != null && e.symbol) {
    return `${tokenAmt(e.amount)} ${e.symbol}${e.counterparty ? ` · ${e.counterparty}` : ''}`
  }
  return e.note || e.kind
}

export default function Activity({ activity }) {
  return (
    <div>
      <div className="kicker">Journal</div>
      <h1 className="title">
        Every move, <i>accounted</i>.
      </h1>
      <p className="lead">
        Confirmed intents land here with a simulated hash. Compound plans write one line per settled step.
      </p>
      <div className="folio">
        {activity.length === 0 ? (
          <div className="empty">The journal is still blank.</div>
        ) : (
          activity.map((e) => (
            <div className="event" key={e.id}>
              <div>
                <div className="kind">{e.kind}</div>
                <div className="mute">{timeAgo(e.ts)}</div>
              </div>
              <div>
                <div>{line(e)}</div>
                <div className="mute">{e.note}</div>
              </div>
              <div className="right">
                <span className="tag ok">{e.status}</span>
                <div className="mute" style={{ marginTop: 6 }}>
                  {e.hash}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
