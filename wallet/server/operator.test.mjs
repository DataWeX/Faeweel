import assert from 'node:assert/strict'
import { HDNodeWallet } from 'ethers'
import { attestWithWallet, canonicalIntent, digestIntent, hmacHex, parseSessionToken, sessionToken } from './logic/crypto.js'
import { decryptDid, encryptDid } from './logic/cipher.js'
import { checkCred, createCred, findCred, normalizeEmail } from './logic/auth.js'
import { digestCard, didDocument } from './logic/identity.js'
import { saveRecovery } from './logic/store.js'

const intent = { kind: 'attest', note: 'Seal the desk', title: 'Operator seal', usd: 0, nonce: 'n1', at: 't1' }
const digest = digestIntent(intent)
assert.equal(digest.startsWith('0x'), true)
assert.equal(digestIntent(intent), digest)
assert.notEqual(digestIntent({ ...intent, note: 'other' }), digest)
assert.match(canonicalIntent(intent), /Seal the desk/)

const wallet = HDNodeWallet.createRandom()
const signed = await attestWithWallet(wallet, intent)
assert.equal(signed.address, wallet.address)
assert.equal(signed.recovered.toLowerCase(), wallet.address.toLowerCase())
assert.equal(signed.digest, digest)

const secret = 'unit-secret'
const token = sessionToken(secret, 'sid-abc')
assert.equal(parseSessionToken(secret, token), 'sid-abc')
assert.equal(parseSessionToken('other', token), null)
assert.equal(hmacHex(secret, 'sid-abc').length, 64)

const did = didDocument({ address: wallet.address, origin: 'https://aether.local', passkeys: 1 })
assert.match(did.id, /^did:aether:0x/)
assert.equal(did.authentication[0], `${did.id}#vault`)
const cardDigest = digestCard({ did, card: { did: did.id, name: 'Aether Clerk' } })
assert.equal(cardDigest.startsWith('0x'), true)

const pin = '123456'
const packed = encryptDid(did.id, pin, secret)
assert.equal(decryptDid(packed, pin, secret), did.id)
assert.notEqual(encryptDid(did.id, pin, secret), packed)
assert.throws(() => encryptDid(did.id, '12', secret), /6-digit/)
assert.throws(() => decryptDid(packed, '654321', secret), /Incorrect PIN/)

assert.equal(normalizeEmail('Clerk@Aether.Local'), 'clerk@aether.local')
assert.throws(() => normalizeEmail('not-an-email'), /Invalid/)
await saveRecovery([])
const bound = await createCred({ email: 'clerk@aether.local', pin, did: did.id, secret })
assert.equal(bound.did, did.id)
assert.equal((await findCred('clerk@aether.local')).email, 'clerk@aether.local')
const opened = await checkCred({ email: 'clerk@aether.local', pin, secret, expectedDid: did.id })
assert.equal(opened.decryptedDid, did.id)
assert.equal(opened.match, true)
await saveRecovery([])

console.log('OK operator digest')
console.log('OK operator ethers attest')
console.log('OK operator session mac')
console.log('OK agentic id did')
console.log('OK afya aes-256-cbc did seal')
console.log('OK afya recovery sleeve')
console.log('all passed')
