export const questDefinitions = Object.freeze([
  Object.freeze({
    id: 'explore-wallet',
    title: 'Explore your wallet',
    description: 'View your wallet assets.',
    xp: 25,
    // Coins are nonredeemable in-app points, not tokens or cash.
    coins: 10,
    event: 'wallet_assets_viewed',
  }),
  Object.freeze({
    id: 'scan-market',
    title: 'Scan the market',
    description: 'Complete a successful live market scan using real market data; simulated or fake data does not count.',
    xp: 25,
    coins: 10,
    event: 'live_market_scan_succeeded',
  }),
  Object.freeze({
    id: 'review-opportunity',
    title: 'Review an opportunity',
    description: 'Open an opportunity to review its details.',
    xp: 25,
    coins: 10,
    event: 'opportunity_detail_opened',
  }),
  Object.freeze({
    id: 'set-risk-limit',
    title: 'Set a risk limit',
    description: 'Save a risk policy for your wallet.',
    xp: 25,
    coins: 10,
    event: 'risk_policy_saved',
  }),
])

const questById = new Map(questDefinitions.map((quest) => [quest.id, quest]))

function progressFor(completed) {
  const rewards = completed.reduce(
    (total, id) => {
      const quest = questById.get(id)
      total.xp += quest.xp
      total.coins += quest.coins
      return total
    },
    { xp: 0, coins: 0 },
  )

  return { completed, ...rewards }
}

export function createProgress() {
  return progressFor([])
}

export function normalizeProgress(input) {
  const candidates = Array.isArray(input?.completed) ? new Set(input.completed) : new Set()
  const completed = []

  for (const quest of questDefinitions) {
    if (!candidates.has(quest.id)) break
    completed.push(quest.id)
  }

  return progressFor(completed)
}

function eventName(event) {
  if (typeof event === 'string') return event
  if (!event || typeof event !== 'object') return null
  return typeof event.type === 'string' ? event.type : event.event
}

function isValidEvent(event, quest) {
  if (eventName(event) !== quest.event) return false
  if (quest.id !== 'scan-market' || typeof event === 'string') return true

  const source = String(event.source ?? event.dataSource ?? '').toLowerCase()
  return event.success === true
    && event.live === true
    && !['fake', 'mock', 'simulated', 'demo'].includes(source)
}

export function completeQuest(progress, event) {
  const normalized = normalizeProgress(progress)
  const nextQuest = questDefinitions[normalized.completed.length]
  if (!nextQuest || !isValidEvent(event, nextQuest)) return normalized

  return progressFor([...normalized.completed, nextQuest.id])
}

export function getLevel(progress) {
  const { xp } = normalizeProgress(progress)
  const xpForNextLevel = 100
  const level = Math.floor(xp / xpForNextLevel) + 1
  const xpIntoLevel = xp % xpForNextLevel

  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    progressPercent: (xpIntoLevel / xpForNextLevel) * 100,
  }
}
