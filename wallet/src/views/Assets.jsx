import { CHAINS, TOKENS } from '../data/seed.js'
import { assetValue } from '../engine/wallet.js'
import { tokenAmt, usd } from '../format.js'

export default function Assets({ assets, total, onAsk }) {
  const rows = [...assets].sort((a, b) => assetValue(b) - assetValue(a))

  return (
    <div>
      <div className="kicker">Positions</div>
      <h1 className="title">
        What the vault <i>holds</i>.
      </h1>
      <p className="lead">
        Marks drift locally so the desk feels alive. Nothing here is custodied off-device; this is a session ledger.
      </p>
      <div className="folio">
        <table className="table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Chain</th>
              <th>Amount</th>
              <th>Mark</th>
              <th>Value</th>
              <th>Weight</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const v = assetValue(a)
              const w = total ? (v / total) * 100 : 0
              return (
                <tr key={a.id} className={onAsk ? 'tap' : ''} onClick={() => onAsk?.(`How much ${a.symbol} do I have?`)}>
                  <td>
                    <div className="token">
                      <div className="glyph">{a.symbol[0]}</div>
                      <div>
                        <div>{a.symbol}</div>
                        <div className="mute">{TOKENS[a.symbol]?.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="tag">{CHAINS[a.chain]?.short || a.chain}</span>
                  </td>
                  <td>{tokenAmt(a.amount)}</td>
                  <td>{usd(a.price)}</td>
                  <td>{usd(v)}</td>
                  <td style={{ width: 140 }}>
                    {w.toFixed(1)}%
                    <div className="bar">
                      <i style={{ width: `${w}%` }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
