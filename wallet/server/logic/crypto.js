import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { getBytes, keccak256, toUtf8Bytes, verifyMessage } from 'ethers'

export function sha256Hex(value) {
  return createHash('sha256').update(String(value)).digest('hex')
}

export function hmacHex(secret, value) {
  return createHmac('sha256', String(secret)).update(String(value)).digest('hex')
}

export function randomId(bytes = 16) {
  return randomBytes(bytes).toString('hex')
}

export function safeEqual(a, b) {
  const left = Buffer.from(String(a))
  const right = Buffer.from(String(b))
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function canonicalIntent(intent) {
  const body = typeof intent === 'string' ? { note: intent } : intent || {}
  return JSON.stringify({
    kind: body.kind || 'attest',
    note: String(body.note || '').trim(),
    title: String(body.title || '').trim(),
    usd: Number(body.usd || 0),
    nonce: String(body.nonce || ''),
    at: String(body.at || ''),
  })
}

export function digestIntent(intent) {
  return keccak256(toUtf8Bytes(canonicalIntent(intent)))
}

export async function attestWithWallet(wallet, intent) {
  const digest = digestIntent(intent)
  const message = getBytes(digest)
  const signature = await wallet.signMessage(message)
  const recovered = verifyMessage(message, signature)
  return {
    digest,
    signature,
    recovered,
    address: wallet.address,
    keccak: digest,
  }
}

export function sessionToken(secret, sid) {
  return `${sid}.${hmacHex(secret, sid)}`
}

export function parseSessionToken(secret, token) {
  const raw = String(token || '')
  const i = raw.lastIndexOf('.')
  if (i < 1) return null
  const sid = raw.slice(0, i)
  const mac = raw.slice(i + 1)
  if (!safeEqual(hmacHex(secret, sid), mac)) return null
  return sid
}
