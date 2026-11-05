import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

function pinError(message, statusCode = 400) {
  const err = new Error(message)
  err.statusCode = statusCode
  return err
}

export function assertPin(pin) {
  const raw = String(pin || '')
  if (!/^\d{6}$/.test(raw)) {
    throw pinError('PIN must be a 6-digit sequence')
  }
  return raw
}

function aesKey(serverSecret, pin) {
  const composite = Buffer.concat([Buffer.from(String(serverSecret || ''), 'utf8'), Buffer.from(pin, 'utf8')])
  return createHash('sha256').update(composite).digest()
}

export function encryptDid(did, pin, serverSecret) {
  const userPin = assertPin(pin)
  const plain = String(did || '').trim()
  if (!plain) throw pinError('DID missing')
  const key = aesKey(serverSecret, userPin)
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  const packed = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return iv.toString('hex') + packed.toString('hex')
}

export function decryptDid(encryptedDid, pin, serverSecret) {
  const userPin = assertPin(pin)
  const raw = String(encryptedDid || '')
  if (raw.length < 48 || raw.length % 2 !== 0 || /[^0-9a-f]/i.test(raw)) {
    throw pinError('Encrypted DID missing')
  }
  const iv = Buffer.from(raw.slice(0, 32), 'hex')
  const data = Buffer.from(raw.slice(32), 'hex')
  if (iv.length !== 16 || data.length < 16) throw pinError('Encrypted DID missing')
  try {
    const decipher = createDecipheriv('aes-256-cbc', aesKey(serverSecret, userPin), iv)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  } catch {
    const err = pinError('Incorrect PIN. Please check your PIN and try again.')
    err.code = 'ERR_OSSL_BAD_DECRYPT'
    throw err
  }
}
