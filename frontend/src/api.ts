const BASE = '/api'

let token: string | null = localStorage.getItem('token')

export const getToken = () => token

export function setToken(value: string | null) {
  token = value
  if (value) localStorage.setItem('token', value)
  else localStorage.removeItem('token')
}

async function problem(res: Response): Promise<string> {
  try {
    const { detail } = await res.json()
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ')
  } catch {
  }
  return `Request failed (${res.status})`
}

async function request(path: string, init: RequestInit = {}) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  if (res.status === 401 && token) {
    setToken(null)
    location.reload()
  }
  if (!res.ok) throw new Error(await problem(res))
  return res.json()
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export type Session = { id: number; created_at: string }
export type Interaction = {
  id: number
  query: string
  answer: string
  sources: string[]
  created_at: string
}
export type Answer = {
  session_id: number
  answer: string
  sources: string[]
  search_query: string
}

export const login = (username: string, password: string): Promise<string> =>
  request('/auth/login', {
    method: 'POST',
    body: new URLSearchParams({ username, password }),
  }).then((r) => r.access_token)

export const register = (gmail: string, username: string, password: string) =>
  request('/auth/register', json({ gmail, username, password }))

export const me = (): Promise<{ id: number; username: string }> => request('/auth/me')

export const listSessions = (): Promise<Session[]> => request('/chat/sessions')

export const listInteractions = (id: number): Promise<Interaction[]> =>
  request(`/chat/sessions/${id}/interactions`)

export const ask = (query: string, session_id: number | null): Promise<Answer> =>
  request('/chat/chat', json({ query, session_id }))

export const wikiUrl = (source: string) =>
  `https://growtopiawiki.com/w/${encodeURIComponent(source.replace(/ /g, '_'))}`
