import type { Plan, BadgeId, Badge } from './types'

export const BADGES: Record<BadgeId, Badge> = {
  first_plan:   { id: 'first_plan',   emoji: '🚀', label: 'First Plan',     description: 'Created your very first plan' },
  streak_3:     { id: 'streak_3',     emoji: '🔥', label: '3-Day Streak',   description: 'Planned 3 days in a row' },
  streak_7:     { id: 'streak_7',     emoji: '⚡', label: 'Week Warrior',   description: 'Planned 7 days in a row' },
  streak_30:    { id: 'streak_30',    emoji: '💎', label: 'Iron Planner',   description: 'Planned 30 days in a row' },
  plans_10:     { id: 'plans_10',     emoji: '🎯', label: '10 Plans',       description: 'Created 10 total plans' },
  plans_30:     { id: 'plans_30',     emoji: '🏆', label: '30 Plans',       description: 'Created 30 total plans' },
  perfect_day:  { id: 'perfect_day',  emoji: '✨', label: 'Perfect Day',    description: 'Scheduled everything with no overflow' },
  perfect_week: { id: 'perfect_week', emoji: '🌟', label: 'Perfect Week',   description: '7 consecutive days with no overflow' },
  early_bird:   { id: 'early_bird',   emoji: '🌅', label: 'Early Bird',     description: 'Created a plan before 8am' },
  night_owl:    { id: 'night_owl',    emoji: '🦉', label: 'Night Owl',      description: 'Created a plan after 9pm' },
}

export interface ScoreBreakdown {
  reason: string
  points: number
}

export function calculatePoints(
  plan: Plan,
  allTimePlans: number,
  currentStreak: number
): { total: number; breakdown: ScoreBreakdown[] } {
  const breakdown: ScoreBreakdown[] = []
  let total = 0

  const add = (reason: string, points: number) => {
    breakdown.push({ reason, points })
    total += points
  }

  // Welcome bonus
  if (allTimePlans === 0) add('Welcome bonus — first plan ever!', 20)

  // Base plan creation
  add('Created a plan', 10)

  // Block count bonus
  if (plan.blocks.length >= 5) add('Planned 5+ blocks', 5)

  // Perfect day (no overflow)
  if (plan.overflow.length === 0) add('Perfect day — no overflow tasks', 10)

  // High priority tasks scheduled
  const highPriorityBlocks = plan.blocks.filter(b => b.priority === 'high').length
  if (highPriorityBlocks >= 2) add('All high-priority tasks scheduled', 8)

  // Streak bonuses
  if (currentStreak >= 7) add('7-day streak bonus', 30)
  else if (currentStreak >= 3) add('3-day streak bonus', 15)

  return { total, breakdown }
}

export function checkNewBadges(
  plan: Plan,
  allTimePlans: number,
  currentStreak: number,
  existingBadgeIds: BadgeId[],
  perfectDaysInARow: number
): Badge[] {
  const newBadges: Badge[] = []
  const has = (id: BadgeId) => existingBadgeIds.includes(id)

  const unlock = (id: BadgeId) => {
    if (!has(id)) newBadges.push(BADGES[id])
  }

  const hour = new Date().getHours()

  if (allTimePlans === 0) unlock('first_plan')
  if (allTimePlans + 1 >= 10) unlock('plans_10')
  if (allTimePlans + 1 >= 30) unlock('plans_30')
  if (plan.overflow.length === 0) unlock('perfect_day')
  if (perfectDaysInARow >= 7) unlock('perfect_week')
  if (currentStreak >= 3) unlock('streak_3')
  if (currentStreak >= 7) unlock('streak_7')
  if (currentStreak >= 30) unlock('streak_30')
  if (hour < 8) unlock('early_bird')
  if (hour >= 21) unlock('night_owl')

  return newBadges
}

export function updateStreak(lastPlanDate: string | null): {
  currentStreak: number
  increment: boolean
} {
  if (!lastPlanDate) return { currentStreak: 1, increment: true }

  const last = new Date(lastPlanDate)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const lastDate = last.toDateString()
  const todayDate = today.toDateString()
  const yesterdayDate = yesterday.toDateString()

  if (lastDate === todayDate) {
    // Already planned today — don't increment
    return { currentStreak: 0, increment: false }
  } else if (lastDate === yesterdayDate) {
    // Consecutive day — continue streak
    return { currentStreak: 1, increment: true }
  } else {
    // Streak broken — reset
    return { currentStreak: 1, increment: false }
  }
}