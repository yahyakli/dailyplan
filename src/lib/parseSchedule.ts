import type { Plan } from './types'

export function parseSchedule(raw: string): Plan {
  // Strip markdown fences if Gemini accidentally adds them
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
  }

  const parsed = JSON.parse(cleaned)

  // Validate required fields
  if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
    throw new Error('Invalid schedule: missing blocks array')
  }
  if (!parsed.date) {
    parsed.date = new Date().toISOString().split('T')[0]
  }
  if (!parsed.overflow || !Array.isArray(parsed.overflow)) {
    parsed.overflow = []
  }
  if (!parsed.insight) {
    parsed.insight = 'Schedule generated successfully.'
  }

  return parsed as Plan
}