import { cashChannels } from '../engine/channel.js'
import { usd } from '../format.js'

export default function Channels({ assets, onAsk }) {
  const rows = cashChannels(assets)
  const total = rows.reduce((s, c) => s + c.amount, 0)
  const live = rows.filter((c) => !c.dry).length

  return (
    <div>
      <div className="kicker">Cash rails</div>
      <h1 className="title">
        Channels, <i>per chain</i>.
      </h1>
      <p className="lead">
        USDC sits as a rail on each chain. Fund a dry sleeve from Ethereum. Sweep a rail home. The clerk still binds every hop to policy.
      </p>

      <div className="grid-2">
        <div className="folio">
          <h3>Float</h3>
          <div className="nav-fig">{usd(total)}</div>
          <div className="hint">{live} of {rows.length} rails live</div>
        </div>
        <div className="folio">
          <h3>How they work</h3>
          <p className="mute" style={{ lineHeight: 1.55 }}>
            Ethereum is home. “Fund Base 500” bridges 500 USDC out. “Sweep Base” brings that rail home. Marks stay 1:1.
          </p>
        </div>
      </div>

      <div className="folio">
        <h3>Rails</h3>
        {rows.map((c) => (
          <div className="row" key={c.id}>
            <div className="token">
              <div className="glyph" style={{ borderColor: c.tone, color: c.tone }}>
                {c.short[0]}
              </div>
              <div>
                <div>
                  {c.name} {c.home ? <span className="tag">Home</span> : null}
                </div>
                <div className="mute">{c.dry ? 'Dry rail' : 'Live USDC'}</div>
              </div>
            </div>
            <div className="right">
              <div>{usd(c.amount)}</div>
              <div className="actions" style={{ marginTop: 6, justifyContent: 'flex-end' }}>
                {c.home ? (
                  <button className="btn ghost" type="button" onClick={() => onAsk('Show channels')}>
                    Read rails
                  </button>
                ) : c.dry ? (
                  <button className="btn primary" type="button" onClick={() => onAsk(`Fund ${c.name} 500`)}>
                    Fund 500
                  </button>
                ) : (
                  <button className="btn ghost" type="button" onClick={() => onAsk(`Sweep ${c.name}`)}>
                    Sweep home
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
