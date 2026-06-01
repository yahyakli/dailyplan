import type { Plan, Block, Badge } from './types'

export interface ScoreBreakdown {
  reason: string
  points: number
}

/**
 * Calculate XP for task completion and plan milestones.
 * Following Section 7.5 of the Blueprint.
 */
export function calculateXP(
  action: 'task_complete' | 'plan_created' | 'plan_completed' | 'streak_day',
  data?: { 
    priority?: string; 
    isPerfect?: boolean; 
    streakDays?: number;
    completionRate?: number;
  }
): { xp: number; reason: string } {
  switch (action) {
    case 'task_complete':
      const p = data?.priority || 'medium'
      if (p === 'low') return { xp: 5, reason: 'Completed a low priority task' }
      if (p === 'high') return { xp: 20, reason: 'Completed a high priority task' }
      if (p === 'critical') return { xp: 35, reason: 'Completed a critical priority task' }
      return { xp: 10, reason: 'Completed a task' }

    case 'plan_created':
      return { xp: 5, reason: 'Created a new plan' }

    case 'plan_completed':
      if (data?.isPerfect) return { xp: 100, reason: 'Perfect plan (100% completion)!' }
      if ((data?.completionRate || 0) >= 90) return { xp: 50, reason: 'Plan completed (90%+)' }
      return { xp: 0, reason: '' }

    case 'streak_day':
      const streak = data?.streakDays || 0
      if (streak >= 30) return { xp: 75, reason: 'Streak bonus (30+ days)' }
      if (streak >= 7) return { xp: 25, reason: 'Streak bonus (7+ days)' }
      return { xp: 0, reason: '' }

    default:
      return { xp: 0, reason: '' }
  }
}

/**
 * Core badge check pipeline.
 * Evaluates unearned badges against user aggregates.
 */
export async function checkBadges(
  userId: string,
  unearnedBadges: any[], // Full Badge documents from DB
  aggregates: {
    planCount: number
    streakCurrent: number
    taskCount: number
    totalXP: number
    criticalTaskCount: number
    earlyStartCount: number
    lateEndCount: number
    contextCounts: Record<string, number>
    allContextsUsed: boolean
    perfectDayCount: number
    perfectStreak: number
    languagesSwitched: number
    darkModeDays: number
    referralCount: number
    [key: string]: any
  }
): Promise<any[]> {
  const earned: any[] = []

  for (const badge of unearnedBadges) {
    const { type, value, priority, context, time, categories } = badge.condition
    let isEarned = false

    switch (type) {
      case 'plan_count':
        isEarned = aggregates.planCount >= value
        break
      case 'streak':
        isEarned = aggregates.streakCurrent >= value
        break
      case 'task_count':
        isEarned = aggregates.taskCount >= value
        break
      case 'total_xp':
        isEarned = aggregates.totalXP >= value
        break
      case 'priority_task_count':
        if (priority === 'critical') isEarned = aggregates.criticalTaskCount >= value
        break
      case 'early_start':
        isEarned = aggregates.earlyStartCount >= value
        break
      case 'late_end':
        isEarned = aggregates.lateEndCount >= value
        break
      case 'context_count':
        if (context) isEarned = (aggregates.contextCounts[context] || 0) >= value
        break
      case 'all_contexts_used':
        isEarned = aggregates.allContextsUsed
        break
      case 'perfect_day':
        isEarned = aggregates.perfectDayCount >= value
        break
      case 'perfect_streak':
        isEarned = aggregates.perfectStreak >= value
        break
      case 'lang_switch':
        isEarned = aggregates.languagesSwitched >= value
        break
      case 'dark_mode_streak':
        isEarned = aggregates.darkModeDays >= value
        break
      case 'referral_count':
        isEarned = aggregates.referralCount >= value
        break
      // Add more cases for the 40 badges...
    }

    if (isEarned) {
      earned.push(badge)
    }
  }

  return earned
}
