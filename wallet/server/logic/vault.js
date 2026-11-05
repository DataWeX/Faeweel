import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HDNodeWallet, Wallet } from 'ethers'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '../data')
const vaultFile = join(dataDir, 'vault.json')

let wallet = null
let secret = ''
let meta = null

export async function bootVault() {
  secret = process.env.AETHER_OPERATOR_SECRET || 'aether-local-operator'
  await mkdir(dataDir, { recursive: true })
  try {
    const raw = JSON.parse(await readFile(vaultFile, 'utf8'))
    wallet = await Wallet.fromEncryptedJson(raw.keystore, secret)
    meta = { address: wallet.address, createdAt: raw.createdAt, source: 'disk' }
  } catch {
    const fresh = HDNodeWallet.createRandom()
    const keystore = await fresh.encrypt(secret)
    meta = { address: fresh.address, createdAt: Date.now(), source: 'born' }
    await writeFile(vaultFile, JSON.stringify({ ...meta, keystore }, null, 2))
    wallet = fresh
  }
  return wallet
}

export function getWallet() {
  if (!wallet) throw new Error('Vault is dark')
  return wallet
}

export function vaultSecret() {
  return secret
}

export function vaultStatus() {
  const w = getWallet()
  return {
    address: w.address,
    createdAt: meta?.createdAt || 0,
    source: meta?.source || 'memory',
    chain: 'local-operator',
    role: 'signer',
  }
}
