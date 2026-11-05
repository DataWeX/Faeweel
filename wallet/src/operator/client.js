const TOKEN_KEY = 'aether.operator.session'

export function loadToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function saveToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const auth = token === undefined ? loadToken() : token
  if (auth) headers.Authorization = `Bearer ${auth}`
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({ ok: false, error: 'Operator silent' }))
  if (!res.ok || data.ok === false) {
    const err = new Error(data.error || `Operator ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}
