import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { loadCredentials, putChallenge, saveCredentials, takeChallenge } from './store.js'

const USER_NAME = 'aether-clerk'
const USER_ID = new TextEncoder().encode('aether-operator-clerk')

function toB64(bytes) {
  return Buffer.from(bytes).toString('base64url')
}

function fromB64(value) {
  return new Uint8Array(Buffer.from(value, 'base64url'))
}

export async function registrationOptions({ rpID, rpName }) {
  const existing = await loadCredentials()
  const options = await generateRegistrationOptions({
    rpName: rpName || 'Faewheel Operator',
    rpID,
    userName: USER_NAME,
    userDisplayName: 'Vault Clerk',
    userID: USER_ID,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    excludeCredentials: existing.map((c) => ({
      id: c.id,
      transports: c.transports,
    })),
  })
  putChallenge(`reg:${rpID}`, options.challenge)
  return options
}

export async function verifyRegistration({ response, rpID, origin }) {
  const expectedChallenge = takeChallenge(`reg:${rpID}`)
  if (!expectedChallenge) throw new Error('Registration challenge expired')
  const verified = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: false,
  })
  if (!verified.verified || !verified.registrationInfo) throw new Error('Passkey refused')
  const info = verified.registrationInfo
  const cred = info.credential || {}
  const row = {
    id: cred.id || info.credentialID,
    publicKey: toB64(cred.publicKey || info.credentialPublicKey),
    counter: cred.counter ?? info.counter ?? 0,
    deviceType: info.credentialDeviceType || 'singleDevice',
    backedUp: Boolean(info.credentialBackedUp),
    transports: response.response?.transports || cred.transports || [],
    enrolledAt: Date.now(),
  }
  const list = await loadCredentials()
  if (!list.some((c) => c.id === row.id)) list.push(row)
  await saveCredentials(list)
  return row
}

export async function authenticationOptions({ rpID }) {
  const existing = await loadCredentials()
  if (!existing.length) throw new Error('No passkey enrolled')
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    allowCredentials: existing.map((c) => ({
      id: c.id,
      transports: c.transports,
    })),
  })
  putChallenge(`auth:${rpID}`, options.challenge)
  return options
}

export async function verifyAuthentication({ response, rpID, origin }) {
  const expectedChallenge = takeChallenge(`auth:${rpID}`)
  if (!expectedChallenge) throw new Error('Assertion challenge expired')
  const list = await loadCredentials()
  const id = response.id || response.rawId
  const cred = list.find((c) => c.id === id)
  if (!cred) throw new Error('Unknown passkey')
  const verified = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: false,
    credential: {
      id: cred.id,
      publicKey: fromB64(cred.publicKey),
      counter: cred.counter,
      transports: cred.transports,
    },
  })
  if (!verified.verified) throw new Error('Passkey assertion failed')
  const next = verified.authenticationInfo?.newCounter
  if (typeof next === 'number') {
    cred.counter = next
    await saveCredentials(list)
  }
  return cred
}

export async function credentialCount() {
  return (await loadCredentials()).length
}
