import { shortAddr, timeAgo } from '../format.js'

function daysLeft(ts) {
  if (!ts) return '—'
  const d = Math.max(0, Math.round((ts - Date.now()) / 86400000))
  return `${d}d`
}

export default function AgenticId({ identity, compact, onOpen }) {
  const id = identity || {}
  const mandate = id.mandate || {}
  const issued = id.issued
  const live = Boolean(id.live)

  return (
    <article className={`aid ${compact ? 'aid-compact' : ''}`}>
      <div className="aid-foil" />
      <header className="aid-top">
        <div>
          <div className="kicker">Agentic ID</div>
          <h2>{id.name || 'Aether Clerk'}</h2>
          <div className="mute">@{id.handle || 'aether.clerk'}</div>
        </div>
        <span className={live ? 'tag ok' : 'tag warn'}>{live ? 'Bound' : 'Unissued'}</span>
      </header>
      <div className="aid-did mono">{id.did || 'did:aether:pending'}</div>
      <div className="aid-grid">
        <div>
          <div className="mute">Signer</div>
          <div className="mono">{shortAddr(id.address)}</div>
        </div>
        <div>
          <div className="mute">Controller</div>
          <div>{id.controller === 'passkey' || id.controller === 'webauthn' ? 'Passkey' : id.controller || '—'}</div>
        </div>
        <div>
          <div className="mute">Mandate</div>
          <div>{daysLeft(mandate.expiresAt)}</div>
        </div>
        <div>
          <div className="mute">Human in loop</div>
          <div>{mandate.humanInLoop === false ? 'Off' : 'On'}</div>
        </div>
        <div>
          <div className="mute">DID seal</div>
          <div>{id.sealed ? 'AES-256' : 'Open'}</div>
        </div>
      </div>
      <div className="chips" style={{ marginTop: 14 }}>
        {(mandate.scopes || []).map((s) => (
          <span className="chip on" key={`s-${s}`}>
            {s}
          </span>
        ))}
        {(mandate.signScopes || []).map((s) => (
          <span className="chip" key={`x-${s}`}>
            sign:{s}
          </span>
        ))}
      </div>
      {issued ? (
        <div className="aid-foot">
          <span className="mono">{issued.fingerprint}</span>
          <span className="mute">{issued.at ? timeAgo(issued.at) : ''}</span>
        </div>
      ) : (
        <div className="aid-foot">
          <span className="mute">Issue after unlocking with a live passkey.</span>
          {onOpen ? (
            <button className="btn ghost" type="button" onClick={onOpen}>
              Open operator
            </button>
          ) : null}
        </div>
      )}
    </article>
  )
}
