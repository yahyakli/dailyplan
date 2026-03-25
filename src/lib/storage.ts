import type { Plan } from './types'

const KEY_API_KEY = 'dailyplan:apikey'
const KEY_PLAN_PREFIX = 'dailyplan:plan:'
const KEY_GUEST_PLAN_COUNT = 'dailyplan:guestcount'

// ─── API Key ──────────────────────────────────────────────────────────────────

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(KEY_API_KEY)
}

export function setApiKey(key: string): void {
  localStorage.setItem(KEY_API_KEY, key)
}

export function clearApiKey(): void {
  localStorage.removeItem(KEY_API_KEY)
}

// ─── Plans (guest localStorage) ───────────────────────────────────────────────

export function savePlanLocally(plan: Plan): void {
  const key = `${KEY_PLAN_PREFIX}${plan.date}`
  localStorage.setItem(key, JSON.stringify({ ...plan, createdAt: new Date().toISOString() }))

  // Track guest plan count for upsell prompt
  const count = getGuestPlanCount()
  localStorage.setItem(KEY_GUEST_PLAN_COUNT, String(count + 1))
}

export function getPlanByDate(date: string): Plan | null {
  const raw = localStorage.getItem(`${KEY_PLAN_PREFIX}${date}`)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function getRecentPlans(limit = 7): Plan[] {
  if (typeof window === 'undefined') return []
  const keys = Object.keys(localStorage)
    .filter(k => k.startsWith(KEY_PLAN_PREFIX))
    .sort()
    .reverse()
    .slice(0, limit)

  return keys.map(k => {
    try { return JSON.parse(localStorage.getItem(k) || '') }
    catch { return null }
  }).filter(Boolean) as Plan[]
}

export function getGuestPlanCount(): number {
  const raw = localStorage.getItem(KEY_GUEST_PLAN_COUNT)
  return raw ? parseInt(raw) : 0
}