import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getBytes, keccak256, toUtf8Bytes, verifyMessage } from 'ethers'
import { decryptDid, encryptDid } from './cipher.js'
import { getWallet, vaultSecret, vaultStatus } from './vault.js'
import { ensureDataDir, loadCredentials } from './store.js'
import { randomId, sha256Hex } from './crypto.js'

const idFile = join(dirname(fileURLToPath(import.meta.url)), '../data/identity.json')

const DEFAULT_SCOPES = ['query', 'quote', 'draft', 'watch', 'route']
const SIGN_SCOPES = ['attest', 'send', 'swap', 'bridge']

function didOf(address) {
  return `did:aether:${String(address).toLowerCase()}`
}

function canonical(doc) {
  return JSON.stringify(doc)
}

export function digestCard(card) {
  return keccak256(toUtf8Bytes(canonical(card)))
}

async function loadIdentity() {
  await ensureDataDir()
  try {
    return JSON.parse(await readFile(idFile, 'utf8'))
  } catch {
    return null
  }
}

async function saveIdentity(row) {
  await ensureDataDir()
  await writeFile(idFile, JSON.stringify(row, null, 2))
  return row
}

export function didDocument({ address, origin, passkeys }) {
  const did = didOf(address)
  return {
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: did,
    controller: [did],
    alsoKnownAs: ['aether:clerk'],
    verificationMethod: [
      {
        id: `${did}#vault`,
        type: 'EcdsaSecp256k1RecoveryMethod2020',
        controller: did,
        blockchainAccountId: `eip155:aether:${address}`,
      },
    ],
    authentication: [`${did}#vault`],
    assertionMethod: [`${did}#vault`],
    capabilityInvocation: [`${did}#vault`],
    service: [
      {
        id: `${did}#clerk`,
        type: 'AetherClerk',
        serviceEndpoint: origin || 'local',
      },
      {
        id: `${did}#passkey`,
        type: 'WebAuthnController',
        serviceEndpoint: `${passkeys || 0} enrolled`,
      },
    ],
  }
}

export async function ensureIdentity() {
  const vault = vaultStatus()
  const existing = await loadIdentity()
  if (existing?.did === didOf(vault.address)) return existing
  const born = {
    did: didOf(vault.address),
    name: 'Aether Clerk',
    handle: 'aether.clerk',
    kind: 'agentic-id',
    controller: 'webauthn',
    address: vault.address,
    createdAt: existing?.createdAt || vault.createdAt || Date.now(),
    mandate: {
      id: `man_${randomId(6)}`,
      scopes: DEFAULT_SCOPES,
      signScopes: SIGN_SCOPES,
      dailyCapUsd: 8000,
      perTxCapUsd: 4000,
      autoExecuteUsd: 200,
      humanInLoop: true,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
    },
    issued: null,
    sealed: null,
  }
  return saveIdentity(born)
}

export async function issueIdentity({ origin, credentialId }) {
  const vault = vaultStatus()
  const wallet = getWallet()
  const base = await ensureIdentity()
  const passkeys = (await loadCredentials()).length
  const did = didDocument({ address: vault.address, origin, passkeys })
  const card = {
    did: base.did,
    name: base.name,
    handle: base.handle,
    kind: 'agentic-id',
    address: vault.address,
    controller: 'passkey',
    credentialId: credentialId || null,
    mandate: base.mandate,
    issuedAt: Date.now(),
    origin: origin || 'local',
  }
  const digest = digestCard({ did, card })
  const signature = await wallet.signMessage(getBytes(digest))
  const recovered = verifyMessage(getBytes(digest), signature)
  const issued = {
    ...base,
    didDoc: did,
    card,
    issued: {
      digest,
      signature,
      recovered,
      at: Date.now(),
      fingerprint: sha256Hex(digest).slice(0, 16),
    },
  }
  await saveIdentity(issued)
  return publicIdentity(issued)
}

export async function sealIdentity(pin) {
  const row = await ensureIdentity()
  const encryptedDid = encryptDid(row.did, pin, vaultSecret())
  const sealed = {
    encryptedDid,
    at: Date.now(),
    fingerprint: sha256Hex(encryptedDid).slice(0, 16),
    alg: 'aes-256-cbc',
  }
  row.sealed = sealed
  await saveIdentity(row)
  return publicIdentity(row)
}

export async function checkIdentity({ pin, encryptedDid }) {
  const row = await loadIdentity()
  const packed = encryptedDid || row?.sealed?.encryptedDid
  if (!packed) {
    const err = new Error('No sealed DID on file')
    err.statusCode = 404
    throw err
  }
  const decryptedDid = decryptDid(packed, pin, vaultSecret())
  const match = Boolean(row?.did) && decryptedDid === row.did
  return {
    ok: true,
    decryptedDid,
    match,
    did: row?.did || decryptedDid,
    bound: match && Boolean(row?.issued?.digest),
  }
}

export async function setMandate(patch) {
  const base = await ensureIdentity()
  const next = {
    ...base.mandate,
    ...patch,
    id: `man_${randomId(6)}`,
    issuedAt: Date.now(),
  }
  if (Array.isArray(patch.scopes)) next.scopes = patch.scopes.filter(Boolean)
  if (Array.isArray(patch.signScopes)) next.signScopes = patch.signScopes.filter(Boolean)
  base.mandate = next
  base.issued = null
  await saveIdentity(base)
  return base
}

export function publicIdentity(row, extras = {}) {
  const vault = vaultStatus()
  const issued = row?.issued || null
  const live = Boolean(issued?.digest)
  return {
    ok: true,
    kind: 'agentic-id',
    did: row?.did || didOf(vault.address),
    name: row?.name || 'Aether Clerk',
    handle: row?.handle || 'aether.clerk',
    address: vault.address,
    controller: row?.controller || 'webauthn',
    mandate: row?.mandate || null,
    issued: issued
      ? {
          digest: issued.digest,
          signature: issued.signature,
          recovered: issued.recovered,
          at: issued.at,
          fingerprint: issued.fingerprint,
          match: issued.recovered?.toLowerCase() === vault.address.toLowerCase(),
        }
      : null,
    live,
    status: live ? 'bound' : 'unissued',
    sealed: row?.sealed
      ? {
          encryptedDid: row.sealed.encryptedDid,
          at: row.sealed.at,
          fingerprint: row.sealed.fingerprint,
          alg: row.sealed.alg || 'aes-256-cbc',
        }
      : null,
    ...extras,
  }
}

export async function identityStatus({ origin } = {}) {
  const row = await ensureIdentity()
  const creds = await loadCredentials()
  const passkeys = creds.length
  return publicIdentity(row, {
    passkeys,
    origin: origin || null,
    didDoc: didDocument({ address: vaultStatus().address, origin, passkeys }),
    controllers: creds.map((c) => ({
      id: c.id,
      deviceType: c.deviceType,
      enrolledAt: c.enrolledAt,
    })),
  })
}

export async function verifyAgentic({ digest, signature }) {
  const vault = vaultStatus()
  if (!digest || !signature) throw new Error('Missing attestation')
  const recovered = verifyMessage(getBytes(digest), signature)
  const row = await loadIdentity()
  const bound = row?.issued?.digest === digest
  return {
    ok: true,
    recovered,
    address: vault.address,
    match: recovered.toLowerCase() === vault.address.toLowerCase(),
    bound,
    did: didOf(vault.address),
  }
}
