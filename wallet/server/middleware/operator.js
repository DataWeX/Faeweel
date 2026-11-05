import { parseSessionToken } from '../logic/crypto.js'
import { getSession } from '../logic/store.js'

export function asyncRoute(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

function readToken(req) {
  const header = String(req.get('authorization') || '')
  return header.startsWith('Bearer ') ? header.slice(7) : req.body?.token || req.query.token
}

export function attachSession(req, _res, next) {
  const sid = parseSessionToken(req.app.get('operatorSecret'), readToken(req))
  if (sid) {
    const session = getSession(sid)
    if (session) {
      req.sessionId = sid
      req.session = session
    }
  }
  next()
}

export function requireSession(req, res, next) {
  attachSession(req, res, () => {
    if (!req.session) {
      return res.status(401).json({ ok: false, error: 'Passkey session missing' })
    }
    next()
  })
}

export function jsonErrors(err, _req, res, _next) {
  const message = err?.message || 'Operator fault'
  if (err?.code === 'ERR_OSSL_BAD_DECRYPT') {
    return res.status(400).json({ ok: false, error: message })
  }
  const status = err?.statusCode || (/expired|missing|Unknown|refused|failed|No passkey|PIN/i.test(message) ? 400 : 500)
  res.status(status).json({ ok: false, error: message })
}
