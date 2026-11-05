export const CHAINS = {
  ethereum: { id: 'ethereum', name: 'Ethereum', short: 'ETH', tone: '#c4a882' },
  base: { id: 'base', name: 'Base', short: 'BASE', tone: '#8ea4c8' },
  arbitrum: { id: 'arbitrum', name: 'Arbitrum', short: 'ARB', tone: '#7aa0c4' },
  optimism: { id: 'optimism', name: 'Optimism', short: 'OP', tone: '#c47a72' },
  solana: { id: 'solana', name: 'Solana', short: 'SOL', tone: '#8fad98' },
}

export const TOKENS = {
  ETH: { symbol: 'ETH', name: 'Ether', color: '#c4a882' },
  USDC: { symbol: 'USDC', name: 'USD Coin', color: '#8ea4c8' },
  WBTC: { symbol: 'WBTC', name: 'Wrapped Bitcoin', color: '#b87333' },
  SOL: { symbol: 'SOL', name: 'Solana', color: '#8fad98' },
  ARB: { symbol: 'ARB', name: 'Arbitrum', color: '#7aa0c4' },
  OP: { symbol: 'OP', name: 'Optimism', color: '#c47a72' },
}

export const CONTACTS = [
  { id: 'alice', name: 'Alice Chen', address: '0x3f2a91c8d4e7b1a06f9c2d8e4a7b3c1f5e8d2a90', note: 'Studio partner', kind: 'person' },
  { id: 'treasury', name: 'Studio Treasury', address: '0x8c1d44e2a9b7f3c605d18e4a2b9c7f1d3e6a8b20', note: 'Ops vault', kind: 'vault' },
  { id: 'builder', name: 'Builder Multisig', address: '0x91aef0c3b8d2461e7a4c9f2d5b8e1a3c6f9d4e70', note: 'Contract deploys', kind: 'multisig' },
  { id: 'exchange', name: 'Exchange Deposit', address: '0x5b7c2e9a1d4f8c3b6e0a9d2f5c8b1e4a7d0c3f60', note: 'CEX intake', kind: 'venue' },
]

export const WALLET = {
  name: 'Primary Vault',
  address: '0x7a91c4e2d8b3f6a1c9e4d7b2a5f8c3e6d1a4b790',
  clerk: 'Aether',
}

export function startOfUtcDay() {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d.getTime()
}

export function initialAssets() {
  return [
    { id: 'eth-main', symbol: 'ETH', chain: 'ethereum', amount: 12.4821, price: 3240.18 },
    { id: 'usdc-main', symbol: 'USDC', chain: 'ethereum', amount: 28420.55, price: 1 },
    { id: 'wbtc-main', symbol: 'WBTC', chain: 'ethereum', amount: 0.4218, price: 97240.0 },
    { id: 'eth-base', symbol: 'ETH', chain: 'base', amount: 2.1044, price: 3240.18 },
    { id: 'usdc-base', symbol: 'USDC', chain: 'base', amount: 2150.0, price: 1 },
    { id: 'sol-main', symbol: 'SOL', chain: 'solana', amount: 145.32, price: 168.4 },
    { id: 'arb-main', symbol: 'ARB', chain: 'arbitrum', amount: 1840.0, price: 0.82 },
    { id: 'op-main', symbol: 'OP', chain: 'optimism', amount: 620.5, price: 1.64 },
  ]
}

export function initialActivity() {
  const now = Date.now()
  return [
    {
      id: 'tx-seed-1',
      kind: 'receive',
      symbol: 'USDC',
      amount: 2400,
      chain: 'ethereum',
      counterparty: 'Studio Treasury',
      hash: '0xa1c3e8··91f2',
      status: 'confirmed',
      ts: now - 1000 * 60 * 38,
      note: 'Invoice 441',
    },
    {
      id: 'tx-seed-2',
      kind: 'swap',
      fromSymbol: 'ETH',
      toSymbol: 'USDC',
      fromAmount: 0.8,
      toAmount: 2588.4,
      chain: 'base',
      hash: '0x91b2d4··c07e',
      status: 'confirmed',
      ts: now - 1000 * 60 * 180,
      note: 'Rebalance sleeve',
    },
    {
      id: 'tx-seed-3',
      kind: 'send',
      symbol: 'ETH',
      amount: 0.15,
      chain: 'ethereum',
      counterparty: 'Alice Chen',
      hash: '0x44e91a··b3d1',
      status: 'confirmed',
      ts: now - 1000 * 60 * 60 * 26,
      note: 'Design retainer',
    },
    {
      id: 'tx-seed-4',
      kind: 'stake',
      symbol: 'ETH',
      amount: 4,
      chain: 'ethereum',
      hash: '0xc8a01f··22ae',
      status: 'confirmed',
      ts: now - 1000 * 60 * 60 * 72,
      note: 'Validator set A',
    },
    {
      id: 'tx-seed-5',
      kind: 'bridge',
      symbol: 'ETH',
      amount: 1.2,
      fromChain: 'ethereum',
      toChain: 'base',
      hash: '0x7d2e11··90c4',
      status: 'confirmed',
      ts: now - 1000 * 60 * 60 * 96,
      note: 'L2 float',
    },
  ]
}

export function initialPolicies() {
  return {
    dailyCapUsd: 8000,
    perTxCapUsd: 4000,
    autoExecuteUsd: 200,
    confirmAboveUsd: 750,
    unknownRecipients: 'block',
    allowedContacts: ['alice', 'treasury', 'builder'],
    allowedChains: ['ethereum', 'base', 'arbitrum', 'optimism', 'solana'],
    spentTodayUsd: 412.5,
    windowStart: startOfUtcDay(),
  }
}

export function initialGoals() {
  return [
    { id: 'eth-weight', label: 'ETH sleeve', token: 'ETH', percent: 55 },
    { id: 'dry-powder', label: 'Dry powder', token: 'USDC', minUsd: 15000 },
  ]
}

export const SUGGESTIONS = [
  'Pay Alice 80 USDC',
  'Show channels',
  'Fund Base 500',
  'Bargain with Alice on 400 USDC',
  'What should I do?',
  'Sweep Base',
]

export const FOLLOWUPS = ['do that', 'why', 'void', 'twice', 'cheaper']

export const HELP = [
  'I am the vault clerk. Speak anything — I react, draft, or bargain, then bind the plan to policy.',
  'I remember the last intent — say yes, why, twice, on Base, or to Alice.',
  'Name a counterparty’s ask and I will counter. Say “draft a send to Alice” if you want a ticket without executing.',
]
