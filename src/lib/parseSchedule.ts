import { type GeneratedPlan } from './types'
import { z } from 'zod'

const GeneratedPlanSchema = z.object({
  planTitle: z.string().max(80),
  tasks: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    category: z.enum(['work', 'health', 'personal', 'learning', 'admin', 'creative']),
    xpValue: z.number().min(5).max(50)
  })),
  aiTip: z.string()
})

export function parseSchedule(raw: string): GeneratedPlan {
  // Strip markdown fences if Gemini accidentally adds them
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('Failed to parse AI JSON:', cleaned)
    throw new Error('Invalid JSON format from AI.')
  }

  const result = GeneratedPlanSchema.safeParse(parsed)
  
  if (!result.success) {
    console.error('Zod validation failed:', result.error.format())
    throw new Error('AI response did not match the expected schema.')
  }

  return result.data
}