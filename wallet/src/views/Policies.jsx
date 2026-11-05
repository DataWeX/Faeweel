import { CHAINS } from '../data/seed.js'
import { shortAddr, usd } from '../format.js'

export default function Policies({ policies, contacts, onChange }) {
  const used = policies.dailyCapUsd ? Math.min(100, (policies.spentTodayUsd / policies.dailyCapUsd) * 100) : 0

  function num(field, value) {
    const n = Number(value)
    if (!Number.isFinite(n) || n < 0) return
    onChange({ [field]: n })
  }

  function toggleContact(id) {
    const has = policies.allowedContacts.includes(id)
    onChange({
      allowedContacts: has
        ? policies.allowedContacts.filter((x) => x !== id)
        : [...policies.allowedContacts, id],
    })
  }

  function toggleChain(id) {
    const has = policies.allowedChains.includes(id)
    if (has && policies.allowedChains.length === 1) return
    onChange({
      allowedChains: has
        ? policies.allowedChains.filter((x) => x !== id)
        : [...policies.allowedChains, id],
    })
  }

  return (
    <div>
      <div className="kicker">Guardrails</div>
      <h1 className="title">
        The clerk may act — <i>within lines</i>.
      </h1>
      <p className="lead">
        Caps, allowlists, and confirmation thresholds are evaluated before any plan settles. Auto-execute only fires
        for a single small ticket under the ceiling.
      </p>

      <div className="policy-grid">
        <div className="folio">
          <h3>Spend window</h3>
          <div className="field">
            <label>Daily cap (USD)</label>
            <input type="number" min="0" value={policies.dailyCapUsd} onChange={(e) => num('dailyCapUsd', e.target.value)} />
          </div>
          <div className="field">
            <label>Per-transaction cap</label>
            <input type="number" min="0" value={policies.perTxCapUsd} onChange={(e) => num('perTxCapUsd', e.target.value)} />
          </div>
          <div className="mute">
            Used today {usd(policies.spentTodayUsd)} · {used.toFixed(0)}%
          </div>
          <div className="meter">
            <i style={{ width: `${used}%` }} />
          </div>
        </div>
        <div className="folio">
          <h3>Autonomy</h3>
          <div className="field">
            <label>Auto-execute under (USD)</label>
            <input type="number" min="0" value={policies.autoExecuteUsd} onChange={(e) => num('autoExecuteUsd', e.target.value)} />
          </div>
          <div className="field">
            <label>Always confirm above</label>
            <input type="number" min="0" value={policies.confirmAboveUsd} onChange={(e) => num('confirmAboveUsd', e.target.value)} />
          </div>
          <div className="field">
            <label>Unknown recipients</label>
            <select value={policies.unknownRecipients} onChange={(e) => onChange({ unknownRecipients: e.target.value })}>
              <option value="block">Block</option>
              <option value="confirm">Allow with confirm</option>
            </select>
          </div>
        </div>
      </div>

      <div className="folio" style={{ marginTop: 16 }}>
        <h3>Allowed chains</h3>
        <div className="chips" style={{ marginTop: 8 }}>
          {Object.values(CHAINS).map((c) => {
            const on = policies.allowedChains.includes(c.id)
            return (
              <button key={c.id} className={`chip ${on ? 'on' : ''}`} onClick={() => toggleChain(c.id)}>
                {on ? 'On · ' : 'Off · '}
                {c.name}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="kicker" style={{ marginBottom: 12 }}>
          Recipient allowlist
        </div>
        <div className="people">
          {contacts.map((c) => {
            const on = policies.allowedContacts.includes(c.id)
            return (
              <button
                key={c.id}
                className="person"
                onClick={() => toggleContact(c.id)}
                style={{ borderColor: on ? 'rgba(196,163,90,0.45)' : undefined }}
              >
                <b>{c.name}</b>
                <div className="mute">{c.note}</div>
                <div className="mute mono" style={{ marginTop: 8 }}>
                  {shortAddr(c.address)}
                </div>
                <div style={{ marginTop: 10 }}>
                  <span className={on ? 'tag ok' : 'tag'}>{on ? 'Allowlisted' : 'Blocked'}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
