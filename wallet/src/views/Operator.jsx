import { useEffect, useState } from 'react'
import { shortAddr, timeAgo } from '../format.js'
import { api, loadToken, saveToken } from '../operator/client.js'
import { assertPasskey, createPasskey, webauthnReady } from '../operator/webauthn.js'
import AgenticId from './AgenticId.jsx'

export default function Operator() {
  const [status, setStatus] = useState(null)
  const [session, setSession] = useState(null)
  const [ledger, setLedger] = useState([])
  const [note, setNote] = useState('Seal the desk from the operator')
  const [pin, setPin] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [last, setLast] = useState(null)
  const [revealed, setRevealed] = useState(null)
  const [recovery, setRecovery] = useState(null)
  const live = webauthnReady()

  async function refresh() {
    const st = await api('/status')
    setStatus(st)
    const token = loadToken()
    if (!token) {
      setSession(null)
      setLedger([])
      return
    }
    try {
      const s = await api('/session')
      setSession(s)
      const rows = await api('/ledger')
      setLedger(rows.rows || [])
    } catch {
      saveToken('')
      setSession(null)
      setLedger([])
    }
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.message))
  }, [])

  async function run(label, fn) {
    setBusy(label)
    setError('')
    try {
      await fn()
      await refresh()
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setBusy('')
    }
  }

  function enroll() {
    return run('enroll', async () => {
      const begin = await api('/webauthn/register/begin', { method: 'POST', body: {} })
      const credential = await createPasskey(begin.options)
      await api('/webauthn/register/finish', { method: 'POST', body: { credential } })
    })
  }

  function unlock() {
    return run('unlock', async () => {
      const begin = await api('/webauthn/auth/begin', { method: 'POST', body: {} })
      const credential = await assertPasskey(begin.options)
      const done = await api('/webauthn/auth/finish', { method: 'POST', body: { credential } })
      saveToken(done.token)
    })
  }

  function lock() {
    return run('lock', async () => {
      try {
        await api('/logout', { method: 'POST', body: {} })
      } catch {
        /* still drop local token */
      }
      saveToken('')
      setLast(null)
    })
  }

  function sign() {
    return run('sign', async () => {
      const signed = await api('/sign', {
        method: 'POST',
        body: { kind: 'attest', note, title: 'Operator seal', usd: 0 },
      })
      setLast(signed)
    })
  }

  function issue() {
    return run('issue', async () => {
      await api('/identity/issue', { method: 'POST', body: {} })
    })
  }

  function sealDid() {
    return run('seal', async () => {
      await api('/identity/seal', { method: 'POST', body: { pin } })
      setPin('')
      setRevealed(null)
    })
  }

  function checkDid() {
    return run('check', async () => {
      const result = await api('/identity/check', { method: 'POST', body: { pin } })
      setRevealed(result)
    })
  }

  function bindSleeve() {
    return run('create', async () => {
      const result = await api('/auth', { method: 'POST', body: { action: 'create', email, pin } })
      setRecovery(result)
      setPin('')
    })
  }

  function openSleeve() {
    return run('login', async () => {
      const result = await api('/auth', { method: 'POST', body: { action: 'check', email, pin } })
      setRecovery(result)
    })
  }

  const vault = status?.vault || session?.vault

  return (
    <div>
      <div className="kicker">Operator · live passkey</div>
      <h1 className="title">
        The signer sits <i>behind</i> the clerk.
      </h1>
      <p className="lead">
        Logic signs. Controllers answer. Middleware gates. A live WebAuthn ceremony issues an Agentic ID — DID on
        the signer, passkey as controller, mandate the clerk may not exceed.
      </p>

      {status?.identity ? <AgenticId identity={status.identity} /> : null}

      <div className="folio" style={{ marginTop: 16 }}>
        <h3>Issue the card</h3>
        <p className="mute">Unlock with a passkey, then bind the DID. Mandate changes void the last issue until you re-seal.</p>
        <div className="actions" style={{ marginTop: 14 }}>
          <button className="btn primary" type="button" disabled={!session || Boolean(busy)} onClick={issue}>
            {busy === 'issue' ? 'Issuing…' : 'Issue Agentic ID'}
          </button>
        </div>
      </div>

      <div className="folio" style={{ marginTop: 16 }}>
        <h3>Vault DID seal</h3>
        <p className="mute">
          AES-256-CBC over the clerk DID. Composite key is the vault secret plus a 6-digit PIN. The seal hides the
          identifier at rest. It does not sign.
        </p>
        <div className="field" style={{ marginTop: 14 }}>
          <label>6-digit PIN</label>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="off"
            placeholder="••••••"
            disabled={Boolean(busy)}
          />
        </div>
        <div className="actions">
          <button className="btn primary" type="button" disabled={!session || pin.length !== 6 || Boolean(busy)} onClick={sealDid}>
            {busy === 'seal' ? 'Sealing…' : 'Seal DID'}
          </button>
          <button className="btn ghost" type="button" disabled={pin.length !== 6 || Boolean(busy)} onClick={checkDid}>
            {busy === 'check' ? 'Checking…' : 'Check DID'}
          </button>
        </div>
        {status?.identity?.sealed ? (
          <div className="kv" style={{ marginTop: 16 }}>
            <span>Cipher</span>
            <span className="mono">{status.identity.sealed.alg}</span>
            <span>Seal</span>
            <span className="mono">{status.identity.sealed.fingerprint}</span>
            <span>Ciphertext</span>
            <span className="mono">{shortAddr(status.identity.sealed.encryptedDid)}</span>
          </div>
        ) : (
          <div className="mute" style={{ marginTop: 12 }}>
            Unlock, enter a PIN, then seal. Check works without a session once a seal exists.
          </div>
        )}
        {revealed ? (
          <div className="kv" style={{ marginTop: 16 }}>
            <span>Decrypted</span>
            <span className="mono">{revealed.decryptedDid}</span>
            <span>Match</span>
            <span>{revealed.match ? 'Vault DID recovered' : 'Mismatch'}</span>
          </div>
        ) : null}
      </div>

      <div className="folio" style={{ marginTop: 16 }}>
        <h3>Recovery sleeve</h3>
        <p className="mute">
          Email plus PIN wraps the clerk DID at rest. This sleeve reveals identity. It does not sign. Passkey still
          gates the vault.
        </p>
        <div className="field" style={{ marginTop: 14 }}>
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            placeholder="clerk@aether.local"
            disabled={Boolean(busy)}
          />
        </div>
        <div className="actions">
          <button className="btn primary" type="button" disabled={!session || !email || pin.length !== 6 || Boolean(busy)} onClick={bindSleeve}>
            {busy === 'create' ? 'Binding…' : 'Bind sleeve'}
          </button>
          <button className="btn ghost" type="button" disabled={!email || pin.length !== 6 || Boolean(busy)} onClick={openSleeve}>
            {busy === 'login' ? 'Opening…' : 'Open sleeve'}
          </button>
        </div>
        {(status?.recovery || []).length ? (
          <div className="kv" style={{ marginTop: 16 }}>
            {status.recovery.map((row) => [
              <span key={`e-${row.email}`}>Sleeve</span>,
              <span className="mono" key={`v-${row.email}`}>
                {row.email} · {row.fingerprint}
              </span>,
            ])}
          </div>
        ) : (
          <div className="mute" style={{ marginTop: 12 }}>
            Unlock, then bind a sleeve so the DID can be recovered without the passkey.
          </div>
        )}
        {recovery?.did || recovery?.decryptedDid ? (
          <div className="kv" style={{ marginTop: 16 }}>
            <span>Recovered</span>
            <span className="mono">{recovery.did || recovery.decryptedDid}</span>
            <span>Note</span>
            <span>{recovery.message || (recovery.match ? 'Vault DID recovered' : 'Opened')}</span>
          </div>
        ) : null}
      </div>

      <div className="grid-2">
        <div className="folio">
          <h3>Vault signer</h3>
          <div className="nav-fig" style={{ fontSize: 28 }}>
            {vault ? shortAddr(vault.address) : '—'}
          </div>
          <div className="mute" style={{ marginTop: 8 }}>
            {vault?.address}
          </div>
          <div className="kv" style={{ marginTop: 14 }}>
            <span>Passkeys</span>
            <span>{status?.passkeys ?? 0}</span>
            <span>RP ID</span>
            <span className="mono">{status?.rpID || '—'}</span>
            <span>Origin</span>
            <span className="mono">{status?.origin || '—'}</span>
            <span>WebAuthn</span>
            <span>{live ? 'Browser ready' : 'Unavailable here'}</span>
          </div>
        </div>
        <div className="folio">
          <h3>Ceremony</h3>
          {!live ? (
            <div className="mute">This browser has no PublicKeyCredential. Use a platform authenticator.</div>
          ) : (
            <div className="mute">Enroll a passkey on this origin, then unlock to sign.</div>
          )}
          <div className="actions" style={{ marginTop: 16 }}>
            <button className="btn primary" type="button" disabled={Boolean(busy) || !live} onClick={enroll}>
              {busy === 'enroll' ? 'Waiting…' : 'Enroll passkey'}
            </button>
            <button className="btn primary" type="button" disabled={Boolean(busy) || !live} onClick={unlock}>
              {busy === 'unlock' ? 'Waiting…' : 'Unlock'}
            </button>
            <button className="btn ghost" type="button" disabled={Boolean(busy) || !session} onClick={lock}>
              Lock
            </button>
          </div>
          <div style={{ marginTop: 14 }}>
            <span className={session ? 'tag ok' : 'tag warn'}>{session ? 'Session live' : 'Locked'}</span>
          </div>
        </div>
      </div>

      <div className="folio" style={{ marginTop: 16 }}>
        <h3>Attest from the operator</h3>
        <div className="field">
          <label>Intent note</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} disabled={!session || Boolean(busy)} />
        </div>
        <div className="actions">
          <button className="btn primary" type="button" disabled={!session || Boolean(busy)} onClick={sign}>
            {busy === 'sign' ? 'Signing…' : 'Sign with ethers'}
          </button>
        </div>
        {error ? (
          <div className="mute" style={{ color: '#c47a72', marginTop: 12 }}>
            {error}
          </div>
        ) : null}
        {last ? (
          <div className="kv" style={{ marginTop: 16 }}>
            <span>Digest</span>
            <span className="mono">{last.digest}</span>
            <span>Signature</span>
            <span className="mono">{shortAddr(last.signature)}</span>
            <span>Recovered</span>
            <span className="mono">{shortAddr(last.recovered)}</span>
            <span>Match</span>
            <span>{last.match ? 'Signer recovered' : 'Mismatch'}</span>
          </div>
        ) : null}
      </div>

      <div className="folio" style={{ marginTop: 16 }}>
        <h3>Operator ledger</h3>
        {ledger.length === 0 ? (
          <div className="mute">No seals yet. Unlock, then attest.</div>
        ) : (
          ledger.map((row) => (
            <div className="row" key={row.id}>
              <div>
                <div>{row.intent?.note || row.intent?.title}</div>
                <div className="mute mono">{row.digest}</div>
              </div>
              <div className="right">
                <div className="mute">{timeAgo(row.ts)}</div>
                <div className="mute">{shortAddr(row.address)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
