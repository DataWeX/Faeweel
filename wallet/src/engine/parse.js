import { CHAINS, CONTACTS, TOKENS } from '../data/seed.js'

const CHAIN_ALIASES = {
  eth: 'ethereum',
  ethereum: 'ethereum',
  mainnet: 'ethereum',
  base: 'base',
  arb: 'arbitrum',
  arbitrum: 'arbitrum',
  op: 'optimism',
  optimism: 'optimism',
  sol: 'solana',
  solana: 'solana',
}

const ACTION = {
  send: 'send',
  transfer: 'send',
  pay: 'send',
  wire: 'send',
  tip: 'send',
  swap: 'swap',
  trade: 'swap',
  exchange: 'swap',
  convert: 'swap',
  bridge: 'bridge',
  move: 'bridge',
  stake: 'stake',
  restake: 'stake',
  unstake: 'unstake',
  rebalance: 'rebalance',
  allocate: 'rebalance',
}

function norm(raw) {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, ' ')
}

function amount(s) {
  if (!s) return null
  const n = Number(String(s).replace(/,/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

function tokenWord(word) {
  if (!word) return null
  const w = word.toUpperCase()
  if (TOKENS[w]) return w
  if (w === 'ETHER') return 'ETH'
  if (w === 'BTC' || w === 'BITCOIN') return 'WBTC'
  if (w === 'USD' || w === 'DOLLARS' || w === 'STABLES' || w === 'STABLE') return 'USDC'
  return null
}

function findToken(text) {
  const found = findAllTokens(text)
  return found[0] || null
}

function findAllTokens(text) {
  const found = []
  for (const sym of Object.keys(TOKENS)) {
    if (new RegExp(`\\b${sym}\\b`, 'i').test(text)) found.push(sym)
  }
  if (!found.includes('ETH') && /\beth(er)?\b/i.test(text)) found.push('ETH')
  if (!found.includes('USDC') && /\b(usd|stables?)\b/i.test(text)) found.push('USDC')
  if (!found.includes('WBTC') && /\b(btc|bitcoin)\b/i.test(text)) found.push('WBTC')
  return found
}

function findChain(text) {
  const lower = text.toLowerCase()
  const explicit = lower.match(
    /\b(?:on|onto)\s+(ethereum|mainnet|base|arbitrum|arb|optimism|op|solana|sol)\b/,
  )
  if (explicit) return CHAIN_ALIASES[explicit[1]]
  for (const [alias, id] of Object.entries(CHAIN_ALIASES)) {
    if (alias === 'eth') continue
    if (new RegExp(`\\b${alias}\\b`).test(lower)) return id
  }
  return null
}

function findContact(text) {
  const lower = text.toLowerCase()
  for (const c of CONTACTS) {
    const first = c.name.split(' ')[0].toLowerCase()
    if (lower.includes(c.name.toLowerCase()) || lower.includes(c.id) || lower.includes(first)) {
      return c
    }
  }
  const m = text.match(/0x[a-fA-F0-9]{8,40}/)
  if (m) return { id: 'raw', name: 'Unknown address', address: m[0], note: 'Parsed from intent', kind: 'raw' }
  return null
}

function usdCap(text) {
  const m = text.match(/\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/)
  return m ? amount(m[1]) : null
}

function percent(text) {
  const m = text.match(/(\d+(?:\.\d+)?)\s*%/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

function amountNear(text, token) {
  if (!token) return null
  const re = new RegExp(
    `([0-9][0-9,]*(?:\\.[0-9]+)?)\\s*${token}\\b|${token}\\s*([0-9][0-9,]*(?:\\.[0-9]+)?)`,
    'i',
  )
  const m = text.match(re)
  if (!m) return null
  return amount(m[1] || m[2])
}

function leadingAmount(text) {
  const m = text.match(/\b([0-9][0-9,]*(?:\.[0-9]+)?)\b/)
  return m ? amount(m[1]) : null
}

function chainOf(token) {
  if (token === 'SOL') return 'solana'
  if (token === 'ARB') return 'arbitrum'
  if (token === 'OP') return 'optimism'
  return 'ethereum'
}

function chainLabel(id) {
  return CHAINS[id]?.name || id
}

function splitClauses(text) {
  return text
    .split(/\s+(?:then|and then|;)\s+/i)
    .map((s) => s.trim())
    .filter(Boolean)
}

function detectAction(lower) {
  for (const [word, kind] of Object.entries(ACTION)) {
    if (new RegExp(`\\b${word}\\b`).test(lower)) return kind
  }
  return null
}

function parseSwapPair(text, tokens) {
  const m = text.match(
    /\b(?:swap|trade|convert|exchange)\s+[\d.,]*\s*([A-Za-z]+)\s+(?:for|to|into)\s+([A-Za-z]+)/i,
  )
  if (m) return { from: tokenWord(m[1]) || tokens[0] || 'ETH', to: tokenWord(m[2]) || tokens[1] || 'USDC' }
  const m2 = text.match(/\b([A-Za-z]+)\s+(?:for|to|into)\s+([A-Za-z]+)/i)
  if (m2 && tokenWord(m2[1]) && tokenWord(m2[2])) {
    return { from: tokenWord(m2[1]), to: tokenWord(m2[2]) }
  }
  return {
    from: tokens[0] || 'ETH',
    to: tokens[1] || (tokens[0] === 'USDC' ? 'ETH' : 'USDC'),
  }
}

function parseBridge(text, foundChain) {
  const lower = text.toLowerCase()
  const toMatch = lower.match(/\b(?:to|onto|into)\s+([a-z]+)/)
  const fromMatch = lower.match(/\bfrom\s+([a-z]+)/)
  const to = toMatch ? CHAIN_ALIASES[toMatch[1]] : foundChain
  const from = fromMatch ? CHAIN_ALIASES[fromMatch[1]] : to === 'ethereum' ? 'base' : 'ethereum'
  return { from: from || 'ethereum', to: to || null }
}

function fromTokenHint(text) {
  const m = text.match(/\bfrom\s+([A-Za-z]+)\b/i)
  if (!m) return null
  return tokenWord(m[1])
}

function draftWatch(text) {
  const lower = text.toLowerCase()
  const token = findToken(text) || 'ETH'
  const op = /\bbelow\b|\bunder\b|\bdrops?\b/.test(lower) ? 'below' : 'above'
  const pct = percent(text)
  const cap = usdCap(text)
  if (/\b(daily|cap|window)\b/.test(lower) && cap) {
    return {
      ok: true,
      watch: {
        id: `w-${Date.now()}`,
        kind: 'cap',
        op: 'below',
        value: cap,
        label: `Day window under $${cap.toLocaleString()}`,
      },
    }
  }
  if (pct != null) {
    return {
      ok: true,
      watch: {
        id: `w-${Date.now()}`,
        kind: 'weight',
        token,
        op,
        value: pct,
        label: `${token} sleeve ${op} ${pct}%`,
      },
    }
  }
  if (cap && /\b(usdc|dry powder|stables)\b/.test(lower)) {
    return {
      ok: true,
      watch: {
        id: `w-${Date.now()}`,
        kind: 'usd',
        token: 'USDC',
        op,
        value: cap,
        label: `USDC ${op} $${cap.toLocaleString()}`,
      },
    }
  }
  if (cap) {
    return {
      ok: true,
      watch: {
        id: `w-${Date.now()}`,
        kind: 'price',
        token,
        op,
        value: cap,
        label: `${token} mark ${op} $${cap.toLocaleString()}`,
      },
    }
  }
  return { ok: false, error: 'Need a threshold, e.g. “watch ETH above 62%” or “alert me if USDC below 12000”.' }
}

function pickSendToken(text, tokens, fundFrom) {
  const scored = []
  for (const t of tokens) {
    if (t === fundFrom) continue
    const amt = amountNear(text, t)
    scored.push({ token: t, amount: amt, rank: amt ? 2 : 1 })
  }
  scored.sort((a, b) => b.rank - a.rank)
  if (scored[0]) return scored[0]
  if (fundFrom && tokens.includes(fundFrom) && tokens.length === 1) {
    return { token: 'USDC', amount: amountNear(text, 'USDC') }
  }
  return { token: tokens.find((t) => t !== fundFrom) || 'USDC', amount: null }
}

export function parseClause(raw) {
  const text = norm(raw)
  if (!text) return { ok: false, error: 'Empty intent', kind: 'none', raw: '' }

  const lower = text.toLowerCase()
  const tokens = findAllTokens(text)
  const chain = findChain(text)
  const contact = findContact(text)
  const fundFrom = fromTokenHint(text)

  if (/^(hi|hello|hey|help|what can you|who are you)\b/.test(lower)) {
    return { ok: true, kind: 'help', raw: text, summary: 'Show what I can do' }
  }

  if (/\b(recommend|what should i|advise|idle capital|what do you (think|suggest))\b/.test(lower)) {
    return { ok: true, kind: 'query', query: 'recommend', raw: text, summary: 'Advise on the vault' }
  }

  if (/\b(watches|standing (orders|watches)|what are you watching)\b/.test(lower)) {
    return { ok: true, kind: 'query', query: 'watches', raw: text, summary: 'List standing watches' }
  }

  if (/\b(channels?|cash rails?|usdc rails?)\b/.test(lower) && !/\b(fund|sweep|top up|fill|load)\b/.test(lower)) {
    return { ok: true, kind: 'query', query: 'channels', raw: text, summary: 'Read cash channels' }
  }

  if (/\b(fund|top up|fill|load)\b/.test(lower) && (chain || /\bchannel\b/.test(lower))) {
    const dest = chain || findChain(text) || 'base'
    const amt = usdCap(text) || amountNear(text, 'USDC') || leadingAmount(text)
    if (!amt) return { ok: false, kind: 'bridge', error: 'Need a USDC amount to fund the channel', raw: text }
    return {
      ok: true,
      kind: 'bridge',
      token: 'USDC',
      amount: amt,
      fromChain: 'ethereum',
      toChain: dest,
      raw: text,
      summary: `Fund ${chainLabel(dest)} channel with ${amt} USDC`,
    }
  }

  if (/\bsweep\b/.test(lower)) {
    const from = chain || findChain(text)
    if (!from) return { ok: false, kind: 'sweep', error: 'Need a channel to sweep, e.g. “sweep Base”', raw: text }
    const amt = usdCap(text) || amountNear(text, 'USDC') || leadingAmount(text)
    return {
      ok: true,
      kind: 'sweep',
      token: 'USDC',
      amount: amt || null,
      fromChain: from,
      toChain: 'ethereum',
      raw: text,
      summary: amt ? `Sweep ${amt} USDC from ${chainLabel(from)}` : `Sweep ${chainLabel(from)} channel home`,
    }
  }

  if (/\b(watch|alert me|notify|if .*goes? (above|below)|when .* (above|below))\b/.test(lower)) {
    const drafted = draftWatch(text)
    if (!drafted.ok) return { ok: false, kind: 'watch', error: drafted.error, raw: text }
    return {
      ok: true,
      kind: 'watch',
      watch: drafted.watch,
      raw: text,
      summary: `Stand watch: ${drafted.watch.label}`,
    }
  }

  if (/\b(risk|concentrat|too much|overweight)\b/.test(lower) && !detectAction(lower)) {
    return { ok: true, kind: 'query', query: 'risk', raw: text, summary: 'Read concentration risk' }
  }

  if (/\bhow much\b/.test(lower) || (/\b(balance|holdings?)\b/.test(lower) && findToken(text))) {
    const token = findToken(text)
    if (token) {
      return { ok: true, kind: 'query', query: 'token', token, raw: text, summary: `How much ${token} is on the books` }
    }
  }

  if (/\b(portfolio|holdings|balance|exposure|net worth|what do i (have|hold)|overview|nav)\b/.test(lower)) {
    return { ok: true, kind: 'query', query: 'portfolio', raw: text, summary: 'Review portfolio exposure' }
  }

  if (/\b(activity|history|transactions|journal|recent)\b/.test(lower)) {
    return { ok: true, kind: 'query', query: 'activity', raw: text, summary: 'Show the journal' }
  }

  if (/\b(policy|policies|guardrail|rules)\b/.test(lower) && !/\bset\b|\bchange\b|\braise\b|\blower\b/.test(lower)) {
    return { ok: true, kind: 'query', query: 'policies', raw: text, summary: 'Review spending rules' }
  }

  if (/\b(daily (limit|cap)|set daily|change daily|raise daily|lower daily)\b/.test(lower)) {
    const value = usdCap(text)
    if (!value) return { ok: false, kind: 'policy', error: 'Need a USD amount for the daily cap', raw: text }
    return { ok: true, kind: 'policy', field: 'dailyCapUsd', value, raw: text, summary: `Set daily cap to $${value.toLocaleString()}` }
  }

  if (/\b(per[- ]?tx|transaction (limit|cap)|max (tx|transaction))\b/.test(lower)) {
    const value = usdCap(text)
    if (!value) return { ok: false, kind: 'policy', error: 'Need a USD amount for the per-tx cap', raw: text }
    return { ok: true, kind: 'policy', field: 'perTxCapUsd', value, raw: text, summary: `Set per-tx cap to $${value.toLocaleString()}` }
  }

  if (/\bauto[- ]?execut/.test(lower)) {
    const value = usdCap(text)
    if (!value) return { ok: false, kind: 'policy', error: 'Need a USD amount for auto-execute', raw: text }
    return { ok: true, kind: 'policy', field: 'autoExecuteUsd', value, raw: text, summary: `Auto-execute under $${value.toLocaleString()}` }
  }

  if (/\brebalance\b|\ballocate\b|\btarget\b/.test(lower)) {
    const pct = percent(text)
    const token = findToken(text) || 'ETH'
    if (pct == null) return { ok: false, kind: 'rebalance', error: 'Need a target percent, e.g. 55% ETH', raw: text }
    return {
      ok: true,
      kind: 'rebalance',
      token,
      percent: pct,
      chain: chain || 'ethereum',
      raw: text,
      summary: `Rebalance so ${token} is ${pct}% of the vault`,
    }
  }

  if (
    /\b(bargain|negotiat|counter(?:offer)?|too (much|steep|high|low|little)|meet in the middle|split the difference|their (ask|offer)|offered|wants?|asking)\b/.test(
      lower,
    )
  ) {
    return parseBargain(text, lower, contact, tokens)
  }

  if (contact && (usdCap(text) || leadingAmount(text)) && /\b(wants?|asks?|asked|quoted|quoting)\b/.test(lower)) {
    return parseBargain(text, lower, contact, tokens)
  }

  let action = detectAction(lower)

  if (!action && contact && (findToken(text) || leadingAmount(text))) action = 'send'

  if (action === 'send') {
    const dollar = text.match(/\$\s*([0-9][0-9,]*(?:\.[0-9]+)?)|\b([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:usd|dollars?)\b/i)
    const picked = pickSendToken(text, tokens, fundFrom)
    const token = dollar && !picked.amount ? 'USDC' : picked.token
    const amt = (dollar && !picked.amount ? amount(dollar[1] || dollar[2]) : null) || picked.amount || leadingAmount(text)
    if (!amt) return { ok: false, kind: 'send', error: 'Need an amount to send', raw: text }
    if (!contact) return { ok: false, kind: 'send', error: 'Need a recipient (name or 0x address)', raw: text }
    return {
      ok: true,
      kind: 'send',
      token,
      amount: amt,
      chain: chain || chainOf(token),
      contact,
      fundFrom: fundFrom && fundFrom !== token ? fundFrom : null,
      raw: text,
      summary: `Send ${amt} ${token} to ${contact.name}`,
    }
  }

  if (action === 'swap') {
    const pair = parseSwapPair(text, tokens)
    const amt = amountNear(text, pair.from) || leadingAmount(text)
    if (!amt) return { ok: false, kind: 'swap', error: 'Need an amount to swap', raw: text }
    if (pair.from === pair.to) return { ok: false, kind: 'swap', error: 'Swap needs two different tokens', raw: text }
    return {
      ok: true,
      kind: 'swap',
      fromToken: pair.from,
      toToken: pair.to,
      amount: amt,
      chain: chain || chainOf(pair.from),
      raw: text,
      summary: `Swap ${amt} ${pair.from} for ${pair.to}`,
    }
  }

  if (action === 'bridge') {
    const token = findToken(text) || 'ETH'
    const amt = amountNear(text, token) || leadingAmount(text)
    const dest = parseBridge(text, chain)
    if (!amt) return { ok: false, kind: 'bridge', error: 'Need an amount to bridge', raw: text }
    if (!dest.to) return { ok: false, kind: 'bridge', error: 'Need a destination chain', raw: text }
    return {
      ok: true,
      kind: 'bridge',
      token,
      amount: amt,
      fromChain: dest.from,
      toChain: dest.to,
      raw: text,
      summary: `Bridge ${amt} ${token} from ${chainLabel(dest.from)} to ${chainLabel(dest.to)}`,
    }
  }

  if (action === 'stake' || action === 'unstake') {
    const token = findToken(text) || 'ETH'
    const amt = amountNear(text, token) || leadingAmount(text)
    if (!amt) return { ok: false, kind: action, error: `Need an amount to ${action}`, raw: text }
    return {
      ok: true,
      kind: action,
      token,
      amount: amt,
      chain: chain || 'ethereum',
      raw: text,
      summary: `${action === 'stake' ? 'Stake' : 'Unstake'} ${amt} ${token}`,
    }
  }

  const loose = draftLoose(text, { tokens, chain, contact, fundFrom })
  if (loose) return { ...loose, drafted: true }

  return {
    ok: true,
    kind: 'talk',
    raw: text,
    topic: text,
    summary: 'Clerk reaction',
  }
}

function parseBargain(text, lower, contact, tokens) {
  const who = contact || CONTACTS[0]
  const token = findToken(text) || tokens[0] || 'USDC'
  const ask = usdCap(text) || leadingAmount(text)
  let stance = 'high'
  if (/\btoo (low|little|small|cheap)\b/.test(lower)) stance = 'low'
  const move = /\bmeet in the middle|split the difference\b/.test(lower) ? 'mid' : 'counter'
  return {
    ok: true,
    kind: 'bargain',
    contact: who,
    token,
    ask: ask || null,
    stance,
    move,
    raw: text,
    summary: ask ? `Bargain with ${who.name} on ${ask} ${token}` : `Bargain with ${who.name}`,
  }
}

function draftLoose(text, { tokens, chain, contact, fundFrom }) {
  if (/\b(draft|sketch|prepare|write up|make (me )?a plan)\b/.test(text.toLowerCase()) || contact) {
    const dollar = text.match(/\$\s*([0-9][0-9,]*(?:\.[0-9]+)?)|\b([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:usd|dollars?)\b/i)
    const picked = pickSendToken(text, tokens, fundFrom)
    const amt = (dollar ? amount(dollar[1] || dollar[2]) : null) || picked.amount || leadingAmount(text)
    if (contact && amt) {
      const token = dollar && !picked.amount ? 'USDC' : picked.token
      return {
        ok: true,
        kind: 'send',
        token,
        amount: amt,
        chain: chain || chainOf(token),
        contact,
        fundFrom: fundFrom && fundFrom !== token ? fundFrom : null,
        raw: text,
        summary: `Draft: send ${amt} ${token} to ${contact.name}`,
      }
    }
  }
  if (tokens.length >= 2) {
    const pair = parseSwapPair(text, tokens)
    const amt = amountNear(text, pair.from) || leadingAmount(text)
    if (amt && pair.from !== pair.to) {
      return {
        ok: true,
        kind: 'swap',
        fromToken: pair.from,
        toToken: pair.to,
        amount: amt,
        chain: chain || chainOf(pair.from),
        raw: text,
        summary: `Draft: swap ${amt} ${pair.from} for ${pair.to}`,
      }
    }
  }
  return null
}

export function parseUtterance(raw) {
  const text = norm(raw)
  if (!text) return { ok: false, error: 'Empty intent', clauses: [] }
  const parts = splitClauses(text)
  const clauses = parts.map(parseClause)
  const bad = clauses.find((c) => !c.ok)
  if (bad && clauses.length === 1) return { ok: false, error: bad.error, clauses }
  if (bad) return { ok: false, error: `Could not parse “${bad.raw}”: ${bad.error}`, clauses }
  return { ok: true, clauses, raw: text }
}
