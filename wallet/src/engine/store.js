import { initialActivity, initialAssets, initialPolicies } from '../data/seed.js'
import { defaultWatches } from './watch.js'

const KEY = 'aether.vault.v3'

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.assets) || !data.policies) return null
    return data
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        assets: state.assets,
        activity: state.activity.slice(0, 80),
        policies: state.policies,
        messages: (state.messages || []).slice(-40),
        watches: state.watches || [],
      }),
    )
  } catch {
    /* ignore quota */
  }
}

export function freshState() {
  return {
    assets: initialAssets(),
    activity: initialActivity(),
    policies: initialPolicies(),
    watches: defaultWatches(),
  }
}
