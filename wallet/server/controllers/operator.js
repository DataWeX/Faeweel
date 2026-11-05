import { randomUUID } from 'node:crypto'
import { attestWithWallet, digestIntent, randomId, sessionToken } from '../logic/crypto.js'
import { checkCred, createCred, listRecovery } from '../logic/auth.js'
import { checkIdentity, identityStatus, issueIdentity, sealIdentity, setMandate, verifyAgentic } from '../logic/identity.js'
import { appendLedger, dropSession, loadCredentials, loadLedger, putSession } from '../logic/store.js'
import { getWallet, vaultSecret, vaultStatus } from '../logic/vault.js'
import {
  authenticationOptions,
  credentialCount,
  registrationOptions,
  verifyAuthentication,
  verifyRegistration,
} from '../logic/webauthn.js'

function hostOf(req) {
  const raw = String(req.get('x-forwarded-host') || req.get('host') || 'localhost')
  return raw.split(',')[0].trim().split(':')[0]
}

function originOf(req) {
  const proto = String(req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim()
  const host = String(req.get('x-forwarded-host') || req.get('host') || 'localhost').split(',')[0].trim()
  return `${proto}://${host}`
}

export async function status(_req, res) {
  const vault = vaultStatus()
  const identity = await identityStatus({ origin: originOf(_req) })
  const recovery = await listRecovery()
  res.json({
    ok: true,
    operator: 'Aether',
    vault,
    identity,
    passkeys: await credentialCount(),
    recovery,
    origin: originOf(_req),
    rpID: hostOf(_req),
  })
}

export async function beginRegister(req, res) {
  const rpID = hostOf(req)
  const options = await registrationOptions({ rpID, rpName: 'Aether Operator' })
  res.json({ ok: true, options, rpID, origin: originOf(req) })
}

export async function finishRegister(req, res) {
  const rpID = hostOf(req)
  const cred = await verifyRegistration({
    response: req.body?.credential || req.body,
    rpID,
    origin: originOf(req),
  })
  res.json({
    ok: true,
    enrolled: true,
    credentialId: cred.id,
    deviceType: cred.deviceType,
    backedUp: cred.backedUp,
  })
}

export async function beginAuth(req, res) {
  const rpID = hostOf(req)
  const options = await authenticationOptions({ rpID })
  res.json({ ok: true, options, rpID, origin: originOf(req) })
}

export async function finishAuth(req, res) {
  const rpID = hostOf(req)
  const cred = await verifyAuthentication({
    response: req.body?.credential || req.body,
    rpID,
    origin: originOf(req),
  })
  const sid = randomId(18)
  putSession(sid, { credentialId: cred.id, at: Date.now() })
  const token = sessionToken(req.app.get('operatorSecret'), sid)
  res.json({
    ok: true,
    token,
    credentialId: cred.id,
    session: sid.slice(0, 8),
  })
}

export async function logout(req, res) {
  if (req.sessionId) dropSession(req.sessionId)
  res.json({ ok: true })
}

export async function session(req, res) {
  const creds = await loadCredentials()
  const row = creds.find((c) => c.id === req.session.credentialId)
  res.json({
    ok: true,
    live: true,
    credentialId: req.session.credentialId,
    enrolledAt: row?.enrolledAt || null,
    vault: vaultStatus(),
  })
}

export async function signIntent(req, res) {
  const intent = {
    kind: req.body?.kind || 'attest',
    note: req.body?.note || req.body?.title || 'Desk seal',
    title: req.body?.title || '',
    usd: Number(req.body?.usd || 0),
    nonce: randomUUID(),
    at: new Date().toISOString(),
  }
  const signed = await attestWithWallet(getWallet(), intent)
  const entry = await appendLedger({
    id: randomId(8),
    ts: Date.now(),
    intent,
    digest: signed.digest,
    signature: signed.signature,
    recovered: signed.recovered,
    address: signed.address,
    credentialId: req.session.credentialId,
  })
  res.json({
    ok: true,
    intent,
    digest: signed.digest,
    signature: signed.signature,
    recovered: signed.recovered,
    address: signed.address,
    match: signed.recovered.toLowerCase() === signed.address.toLowerCase(),
    ledgerId: entry.id,
  })
}

export async function ledger(_req, res) {
  const rows = await loadLedger()
  res.json({ ok: true, rows: rows.slice(0, 24) })
}

export async function digestPreview(req, res) {
  const intent = {
    kind: req.body?.kind || 'attest',
    note: req.body?.note || '',
    title: req.body?.title || '',
    usd: Number(req.body?.usd || 0),
    nonce: req.body?.nonce || 'preview',
    at: req.body?.at || 'preview',
  }
  res.json({ ok: true, digest: digestIntent(intent), intent })
}

export async function identity(req, res) {
  res.json(await identityStatus({ origin: originOf(req) }))
}

export async function issueId(req, res) {
  const issued = await issueIdentity({
    origin: originOf(req),
    credentialId: req.session?.credentialId,
  })
  res.json(issued)
}

export async function mandate(req, res) {
  const patch = {
    dailyCapUsd: Number(req.body?.dailyCapUsd),
    perTxCapUsd: Number(req.body?.perTxCapUsd),
    autoExecuteUsd: Number(req.body?.autoExecuteUsd),
    humanInLoop: req.body?.humanInLoop !== false,
  }
  if (Array.isArray(req.body?.scopes)) patch.scopes = req.body.scopes
  if (Array.isArray(req.body?.signScopes)) patch.signScopes = req.body.signScopes
  const next = await setMandate(patch)
  res.json(await identityStatus({ origin: originOf(req), mandate: next.mandate }))
}

export async function verifyId(req, res) {
  const result = await verifyAgentic({
    digest: req.body?.digest,
    signature: req.body?.signature,
  })
  res.json(result)
}

export async function sealId(req, res) {
  const sealed = await sealIdentity(req.body?.pin || req.body?.secretKey)
  res.json(sealed)
}

export async function checkId(req, res) {
  const result = await checkIdentity({
    pin: req.body?.pin || req.query?.pin || req.query?.secretKey,
    encryptedDid: req.body?.encryptedDid || req.query?.encryptedDid || req.query?.encryptedDID,
  })
  res.json(result)
}

export async function auth(req, res) {
  const body = req.body || {}
  const query = req.query || {}
  const action = String(body.action || query.action || '').trim().toLowerCase()
  const email = body.email || query.email
  const pin = body.pin || body.secretKey || query.pin || query.secretKey
  const secret = vaultSecret()
  const identity = await identityStatus({ origin: originOf(req) })

  if (!action) {
    const err = new Error('Action not specified!')
    err.statusCode = 401
    throw err
  }

  if (action === 'check') {
    res.json(await checkCred({ email, pin, secret, expectedDid: identity.did }))
    return
  }

  if (action === 'create') {
    if (!req.session) {
      const err = new Error('Passkey session missing')
      err.statusCode = 401
      throw err
    }
    res.status(201).json(
      await createCred({
        email,
        pin,
        did: identity.did,
        secret,
      }),
    )
    return
  }

  const err = new Error('Action not specified!')
  err.statusCode = 401
  throw err
}
