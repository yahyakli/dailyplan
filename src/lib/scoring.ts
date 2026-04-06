import type { Plan, BadgeId, Badge } from './types'

export const BADGES: Record<BadgeId, Badge> = {
  first_plan:       { id: 'first_plan',       emoji: '🚀', label: 'First Plan',       description: 'Created your very first plan' },
  streak_3:         { id: 'streak_3',         emoji: '🔥', label: '3-Day Streak',     description: 'Planned 3 days in a row' },
  streak_7:         { id: 'streak_7',         emoji: '⚡', label: 'Week Warrior',     description: 'Planned 7 days in a row' },
  streak_14:        { id: 'streak_14',        emoji: '💪', label: 'Fortnight Force',  description: 'Planned 14 days in a row' },
  streak_30:        { id: 'streak_30',        emoji: '💎', label: 'Iron Planner',     description: 'Planned 30 days in a row' },
  plans_10:         { id: 'plans_10',         emoji: '🎯', label: '10 Plans',         description: 'Created 10 total plans' },
  plans_30:         { id: 'plans_30',         emoji: '🏆', label: '30 Plans',         description: 'Created 30 total plans' },
  plans_50:         { id: 'plans_50',         emoji: '🏅', label: '50 Plans',         description: 'Created 50 total plans' },
  plans_100:        { id: 'plans_100',        emoji: '👑', label: 'Century Planner',  description: 'Created 100 total plans' },
  perfect_day:      { id: 'perfect_day',      emoji: '✨', label: 'Perfect Day',      description: 'Scheduled everything with no overflow' },
  perfect_week:     { id: 'perfect_week',     emoji: '🌟', label: 'Perfect Week',     description: '7 consecutive days with no overflow' },
  early_bird:       { id: 'early_bird',       emoji: '🌅', label: 'Early Bird',       description: 'Created a plan before 8 AM' },
  night_owl:        { id: 'night_owl',        emoji: '🦉', label: 'Night Owl',        description: 'Created a plan after 9 PM' },
  deep_focus:       { id: 'deep_focus',       emoji: '🧠', label: 'Deep Focus',       description: 'Scheduled 3+ deep-work blocks in one plan' },
  variety:          { id: 'variety',          emoji: '🎨', label: 'Renaissance',       description: 'Used all 5 block categories in one plan' },
  weekend_warrior:  { id: 'weekend_warrior',  emoji: '🗓️', label: 'Weekend Warrior',  description: 'Created a plan on a weekend' },
}

// Badge category groupings for the badges page
export const BADGE_CATEGORIES = {
  milestones: {
    label: 'Milestones',
    ids: ['first_plan', 'plans_10', 'plans_30', 'plans_50', 'plans_100'] as BadgeId[],
  },
  streaks: {
    label: 'Streaks',
    ids: ['streak_3', 'streak_7', 'streak_14', 'streak_30'] as BadgeId[],
  },
  special: {
    label: 'Special',
    ids: ['perfect_day', 'perfect_week', 'early_bird', 'night_owl', 'deep_focus', 'variety', 'weekend_warrior'] as BadgeId[],
  },
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

  // Deep focus bonus
  const deepWorkBlocks = plan.blocks.filter(b => b.category === 'deep-work').length
  if (deepWorkBlocks >= 3) add('Deep focus — 3+ deep-work blocks', 8)

  // Variety bonus
  const categories = new Set(plan.blocks.map(b => b.category))
  if (categories.size >= 5) add('Variety — all categories used', 5)

  // Streak bonuses
  if (currentStreak >= 30) add('30-day streak bonus', 50)
  else if (currentStreak >= 14) add('14-day streak bonus', 35)
  else if (currentStreak >= 7) add('7-day streak bonus', 30)
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
  const day = new Date().getDay() // 0=Sunday, 6=Saturday

  // Milestone badges
  if (allTimePlans === 0) unlock('first_plan')
  if (allTimePlans + 1 >= 10) unlock('plans_10')
  if (allTimePlans + 1 >= 30) unlock('plans_30')
  if (allTimePlans + 1 >= 50) unlock('plans_50')
  if (allTimePlans + 1 >= 100) unlock('plans_100')

  // Perfect day/week badges
  if (plan.overflow.length === 0) unlock('perfect_day')
  if (perfectDaysInARow >= 7) unlock('perfect_week')

  // Streak badges
  if (currentStreak >= 3) unlock('streak_3')
  if (currentStreak >= 7) unlock('streak_7')
  if (currentStreak >= 14) unlock('streak_14')
  if (currentStreak >= 30) unlock('streak_30')

  // Time-based badges
  if (hour < 8) unlock('early_bird')
  if (hour >= 21) unlock('night_owl')

  // Plan content badges
  const deepWorkBlocks = plan.blocks.filter(b => b.category === 'deep-work').length
  if (deepWorkBlocks >= 3) unlock('deep_focus')

  const categories = new Set(plan.blocks.map(b => b.category))
  if (categories.size >= 5) unlock('variety')

  // Weekend badge
  if (day === 0 || day === 6) unlock('weekend_warrior')

  return newBadges
}

/**
 * Returns progress toward a specific badge.
 * { current, target, percentage }
 */
export function getBadgeProgress(
  badgeId: BadgeId,
  stats: { allTimePlans: number; currentStreak: number; perfectDaysInARow: number }
): { current: number; target: number; percentage: number } {
  const { allTimePlans, currentStreak, perfectDaysInARow } = stats

  const progressMap: Record<string, { current: number; target: number }> = {
    first_plan:      { current: Math.min(allTimePlans, 1), target: 1 },
    plans_10:        { current: Math.min(allTimePlans, 10), target: 10 },
    plans_30:        { current: Math.min(allTimePlans, 30), target: 30 },
    plans_50:        { current: Math.min(allTimePlans, 50), target: 50 },
    plans_100:       { current: Math.min(allTimePlans, 100), target: 100 },
    streak_3:        { current: Math.min(currentStreak, 3), target: 3 },
    streak_7:        { current: Math.min(currentStreak, 7), target: 7 },
    streak_14:       { current: Math.min(currentStreak, 14), target: 14 },
    streak_30:       { current: Math.min(currentStreak, 30), target: 30 },
    perfect_week:    { current: Math.min(perfectDaysInARow, 7), target: 7 },
  }

  const progress = progressMap[badgeId]
  if (!progress) {
    // Badges without numeric progress (early_bird, night_owl, etc.)
    return { current: 0, target: 1, percentage: 0 }
  }

  const percentage = Math.round((progress.current / progress.target) * 100)
  return { ...progress, percentage: Math.min(percentage, 100) }
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