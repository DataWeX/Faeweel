import { assertPin, decryptDid, encryptDid } from './cipher.js'
import { randomId, sha256Hex } from './crypto.js'
import { loadRecovery, saveRecovery } from './store.js'

function fail(message, statusCode) {
  const err = new Error(message)
  err.statusCode = statusCode
  return err
}

export function normalizeEmail(email) {
  const raw = String(email || '').trim().toLowerCase()
  if (!raw) throw fail('Invalid or blank input(s)!', 401)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) throw fail('Invalid or blank input(s)!', 401)
  return raw
}

export async function findCred(email) {
  const key = String(email || '').trim().toLowerCase()
  if (!key) return null
  const list = await loadRecovery()
  return list.find((row) => row.email === key) || null
}

export async function listRecovery() {
  const list = await loadRecovery()
  return list.map((row) => ({
    email: row.email,
    fingerprint: row.fingerprint,
    createdAt: row.createdAt,
  }))
}

export async function createCred({ email, pin, did, secret }) {
  const addr = normalizeEmail(email)
  assertPin(pin)
  const plain = String(did || '').trim()
  if (!plain) throw fail('DID missing', 400)
  if (await findCred(addr)) throw fail('Email is in use. Try another one.', 401)
  const encryptedDid = encryptDid(plain, pin, secret)
  const row = {
    id: randomId(8),
    email: addr,
    encryptedDid,
    fingerprint: sha256Hex(encryptedDid).slice(0, 16),
    createdAt: Date.now(),
  }
  const list = await loadRecovery()
  list.push(row)
  await saveRecovery(list)
  return {
    ok: true,
    did: plain,
    email: addr,
    fingerprint: row.fingerprint,
    message: 'Credentials registered successfully!',
  }
}

export async function checkCred({ email, pin, secret, expectedDid }) {
  const addr = normalizeEmail(email)
  const row = await findCred(addr)
  if (!pin) {
    if (!row) throw fail('Please check your email.', 404)
    return { ok: true, found: true, email: addr, message: 'Email found, continue.' }
  }
  if (!row) throw fail('Email not found!', 404)
  const decryptedDid = decryptDid(row.encryptedDid, pin, secret)
  return {
    ok: true,
    decryptedDid,
    email: addr,
    fingerprint: row.fingerprint,
    match: Boolean(expectedDid) && decryptedDid === expectedDid,
  }
}
