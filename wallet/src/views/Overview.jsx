import { CHAINS } from '../data/seed.js'
import { byChain, bySymbol } from '../engine/wallet.js'
import { readWatch } from '../engine/watch.js'
import { timeAgo, tokenAmt, usd } from '../format.js'
import AgenticId from './AgenticId.jsx'

const PALETTE = ['#c4a35a', '#8fad98', '#8ea4c8', '#c47a72', '#b8a48a', '#6e8b7a']

export default function Overview({ assets, total, activity, policies, spark, brief, watches = [], identity, onAsk, onDropWatch, onOpenId }) {
  const symbols = bySymbol(assets)
  const chains = byChain(assets)
  const used = policies.dailyCapUsd ? Math.min(100, (policies.spentTodayUsd / policies.dailyCapUsd) * 100) : 0
  const maxSpark = Math.max(...spark, 1)

  return (
    <div>
      <div className="kicker">Vault · session ledger</div>
      <h1 className="title">
        Quiet capital, <i>spoken</i> intent.
      </h1>
      <p className="lead">{brief}</p>

      {identity ? <AgenticId identity={identity} compact onOpen={onOpenId} /> : null}

      <div className="grid-2">
        <div className="folio">
          <h3>Net asset value</h3>
          <div className="nav-fig">{usd(total)}</div>
          <div className="hint">Live marks · simulated drift</div>
          <div className="spark" aria-hidden="true">
            {spark.map((v, i) => (
              <i key={i} style={{ height: `${(v / maxSpark) * 100}%` }} />
            ))}
          </div>
        </div>
        <div className="folio">
          <h3>Day window</h3>
          <div className="nav-fig" style={{ fontSize: 34 }}>
            {usd(policies.spentTodayUsd)}
          </div>
          <div className="mute">of {usd(policies.dailyCapUsd)} daily cap</div>
          <div className="meter">
            <i style={{ width: `${used}%` }} />
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <span className="dim">Per-tx cap</span>
            <span>{usd(policies.perTxCapUsd)}</span>
          </div>
          <div className="row">
            <span className="dim">Auto-exec under</span>
            <span>{usd(policies.autoExecuteUsd)}</span>
          </div>
        </div>
      </div>

      <div className="folio" style={{ marginBottom: 16 }}>
        <h3>Allocation</h3>
        <div className="alloc">
          {symbols.map((s, i) => (
            <i
              key={s.symbol}
              title={s.symbol}
              style={{ width: `${total ? (s.value / total) * 100 : 0}%`, background: PALETTE[i % PALETTE.length] }}
            />
          ))}
        </div>
        <div className="legend">
          {symbols.map((s, i) => (
            <span key={s.symbol}>
              <b style={{ background: PALETTE[i % PALETTE.length] }} />
              {s.symbol} {total ? ((s.value / total) * 100).toFixed(0) : 0}%
            </span>
          ))}
        </div>
      </div>

      <div className="split">
        <div className="folio">
          <h3>Sleeves</h3>
          {symbols.map((s) => (
            <button className="row tap" type="button" key={s.symbol} onClick={() => onAsk(`How much ${s.symbol} do I have?`)}>
              <div className="token">
                <div className="glyph">{s.symbol[0]}</div>
                <div>
                  <div>{s.symbol}</div>
                  <div className="mute">{tokenAmt(s.amount)}</div>
                </div>
              </div>
              <div className="right">
                <div>{usd(s.value)}</div>
                <div className="mute">{usd(s.price)}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="folio">
          <h3>Chains</h3>
          {chains.map((c) => (
            <div className="row" key={c.chain}>
              <div>
                <div>{CHAINS[c.chain]?.name || c.chain}</div>
                <div className="mute">{c.assets.length} positions</div>
              </div>
              <div className="right">
                <div>{usd(c.value)}</div>
                <div className="bar" style={{ width: 88 }}>
                  <i style={{ width: `${total ? (c.value / total) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="folio" style={{ marginTop: 16 }}>
        <h3>Standing watches</h3>
        {watches.length === 0 ? (
          <div className="mute">None armed. Say “watch ETH above 62%”.</div>
        ) : (
          watches.map((w) => {
            const r = readWatch(assets, policies, w)
            return (
              <div className="row" key={w.id}>
                <div>
                  <div>{w.label}</div>
                  <div className="mute">
                    Now {r.unit === '%' ? `${r.value.toFixed(1)}%` : usd(r.value)}
                  </div>
                </div>
                <div className="right">
                  <span className={r.tripped ? 'tag warn' : 'tag ok'}>{r.tripped ? 'Tripped' : 'Quiet'}</span>
                  <div className="actions" style={{ marginTop: 6, justifyContent: 'flex-end' }}>
                    {r.tripped ? (
                      <button className="btn primary" onClick={() => onAsk('do that')}>
                        Do that
                      </button>
                    ) : null}
                    {onDropWatch ? (
                      <button className="btn ghost" onClick={() => onDropWatch(w.id)}>
                        Drop
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="folio" style={{ marginTop: 16 }}>
        <h3>Latest movement</h3>
        {activity.slice(0, 4).map((e) => (
          <div className="row" key={e.id}>
            <div>
              <div style={{ textTransform: 'capitalize' }}>{e.kind}</div>
              <div className="mute">{e.note}</div>
            </div>
            <div className="right">
              <div className="mute">{timeAgo(e.ts)}</div>
              <div className="mute">{e.hash}</div>
            </div>
          </div>
        ))}
        <div className="actions" style={{ marginTop: 14 }}>
          <button className="btn ghost" onClick={() => onAsk('What is my exposure?')}>
            Ask exposure
          </button>
          <button className="btn ghost" onClick={() => onAsk('What should I do?')}>
            Ask the clerk
          </button>
          <button className="btn ghost" onClick={() => onAsk('Bargain with Alice on 400 USDC')}>
            Bargain with Alice
          </button>
          <button className="btn ghost" onClick={() => onAsk('Watch ETH above 62%')}>
            Arm a watch
          </button>
        </div>
      </div>
    </div>
  )
}
