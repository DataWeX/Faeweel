function b64url(buffer) {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer || buffer)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(value) {
  const pad = String(value).replace(/-/g, '+').replace(/_/g, '/')
  const padded = pad + '='.repeat((4 - (pad.length % 4 || 4)) % 4)
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out.buffer
}

function decodeOptions(options) {
  const next = { ...options }
  if (typeof next.challenge === 'string') next.challenge = fromB64url(next.challenge)
  if (next.user?.id && typeof next.user.id === 'string') next.user = { ...next.user, id: fromB64url(next.user.id) }
  if (Array.isArray(next.excludeCredentials)) {
    next.excludeCredentials = next.excludeCredentials.map((c) => ({
      ...c,
      id: typeof c.id === 'string' ? fromB64url(c.id) : c.id,
    }))
  }
  if (Array.isArray(next.allowCredentials)) {
    next.allowCredentials = next.allowCredentials.map((c) => ({
      ...c,
      id: typeof c.id === 'string' ? fromB64url(c.id) : c.id,
    }))
  }
  return next
}

function credentialToJSON(cred) {
  const response = cred.response
  const json = {
    id: cred.id,
    rawId: b64url(cred.rawId),
    type: cred.type,
    clientExtensionResults: cred.getClientExtensionResults?.() || {},
    response: {
      clientDataJSON: b64url(response.clientDataJSON),
    },
  }
  if (response.attestationObject) json.response.attestationObject = b64url(response.attestationObject)
  if (response.authenticatorData) json.response.authenticatorData = b64url(response.authenticatorData)
  if (response.signature) json.response.signature = b64url(response.signature)
  if (response.userHandle) json.response.userHandle = b64url(response.userHandle)
  if (response.getTransports) json.response.transports = response.getTransports()
  if (cred.authenticatorAttachment) json.authenticatorAttachment = cred.authenticatorAttachment
  return json
}

export function webauthnReady() {
  return typeof window !== 'undefined' && Boolean(window.PublicKeyCredential)
}

export async function createPasskey(options) {
  const cred = await navigator.credentials.create({ publicKey: decodeOptions(options) })
  if (!cred) throw new Error('Passkey creation cancelled')
  return credentialToJSON(cred)
}

export async function assertPasskey(options) {
  const cred = await navigator.credentials.get({ publicKey: decodeOptions(options) })
  if (!cred) throw new Error('Passkey assertion cancelled')
  return credentialToJSON(cred)
}
