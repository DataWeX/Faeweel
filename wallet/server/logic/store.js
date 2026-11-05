import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../data')
const credFile = join(root, 'webauthn.json')
const ledgerFile = join(root, 'ledger.json')
const recoveryFile = join(root, 'recovery.json')

const challenges = new Map()
const sessions = new Map()

export async function ensureDataDir() {
  await mkdir(root, { recursive: true })
  return root
}

export function putChallenge(key, value, ttlMs = 120000) {
  challenges.set(key, { value, exp: Date.now() + ttlMs })
}

export function takeChallenge(key) {
  const row = challenges.get(key)
  challenges.delete(key)
  if (!row || row.exp < Date.now()) return null
  return row.value
}

export function putSession(id, data, ttlMs = 8 * 3600 * 1000) {
  sessions.set(id, { ...data, exp: Date.now() + ttlMs })
}

export function getSession(id) {
  const row = sessions.get(id)
  if (!row) return null
  if (row.exp < Date.now()) {
    sessions.delete(id)
    return null
  }
  return row
}

export function dropSession(id) {
  sessions.delete(id)
}

export async function loadCredentials() {
  await ensureDataDir()
  try {
    const raw = JSON.parse(await readFile(credFile, 'utf8'))
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export async function saveCredentials(list) {
  await ensureDataDir()
  await writeFile(credFile, JSON.stringify(list, null, 2))
}

export async function loadLedger() {
  await ensureDataDir()
  try {
    const raw = JSON.parse(await readFile(ledgerFile, 'utf8'))
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export async function appendLedger(entry) {
  const list = await loadLedger()
  list.unshift(entry)
  await ensureDataDir()
  await writeFile(ledgerFile, JSON.stringify(list.slice(0, 80), null, 2))
  return list[0]
}

export async function loadRecovery() {
  await ensureDataDir()
  try {
    const raw = JSON.parse(await readFile(recoveryFile, 'utf8'))
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export async function saveRecovery(list) {
  await ensureDataDir()
  await writeFile(recoveryFile, JSON.stringify(list, null, 2))
}
