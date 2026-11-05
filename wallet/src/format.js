export function usd(n, digits = 2) {
  if (n == null || Number.isNaN(Number(n))) return '$0.00'
  const v = Number(n)
  const sign = v < 0 ? '-' : ''
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 10_000) {
    return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  }
  return `${sign}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

export function tokenAmt(n, digits = 4) {
  if (n == null || Number.isNaN(Number(n))) return '0'
  const v = Number(n)
  if (v === 0) return '0'
  if (Math.abs(v) >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (Math.abs(v) < 0.0001) return v.toExponential(2)
  return v.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 })
}

export function shortAddr(addr) {
  if (!addr) return ''
  if (addr.length < 12) return addr
  return `${addr.slice(0, 6)}··${addr.slice(-4)}`
}

export function timeAgo(ts) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (s < 8) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n))
}

export function pct(n) {
  if (!Number.isFinite(n)) return '0%'
  return `${n.toFixed(n >= 10 ? 0 : 1)}%`
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
