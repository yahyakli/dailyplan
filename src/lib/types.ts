// ─── Schedule Types ───────────────────────────────────────────────────────────

export type BlockCategory = 'deep-work' | 'communication' | 'admin' | 'personal' | 'break'
export type Priority = 'high' | 'medium' | 'low'

export interface Block {
  id?: string
  startTime: string   // HH:MM
  endTime: string     // HH:MM
  title: string
  category: BlockCategory
  priority: Priority
  notes?: string
  completed?: boolean
  status?: string              // For Guest persistence (pending, in_progress, completed, skipped)
  progressPercentage?: number  // For Guest persistence (0-100)
}

export interface Plan {
  date: string        // ISO date string
  blocks: Block[]
  overflow: string[]
  insight: string
  rawInput?: string
  createdAt?: string
  status?: 'draft' | 'active' | 'completed'
}

// ─── User & Auth Types ────────────────────────────────────────────────────────

export interface UserProfile {
  _id: string
  name: string
  email: string
  image?: string
  provider?: 'credentials' | 'google'
  createdAt: string
}

// ─── Scoring & Gamification Types ────────────────────────────────────────────

export interface Score {
  userId: string
  totalPoints: number
  weeklyPoints: number
  allTimePlans: number
  lastUpdated: string
}

export interface Streak {
  userId: string
  currentStreak: number
  longestStreak: number
  lastPlanDate: string | null
}

export type BadgeId =
  | 'first_plan'
  | 'streak_3'
  | 'streak_7'
  | 'streak_14'
  | 'streak_30'
  | 'plans_10'
  | 'plans_30'
  | 'plans_50'
  | 'plans_100'
  | 'perfect_day'
  | 'perfect_week'
  | 'early_bird'
  | 'night_owl'
  | 'deep_focus'
  | 'variety'
  | 'weekend_warrior'

export interface Badge {
  id: BadgeId
  label: string
  description: string
  iconName: string
  unlockedAt?: string
}

export interface Achievement {
  userId: string
  badges: { id: BadgeId; unlockedAt: string }[]
}

// ─── Leaderboard Types ────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  image?: string
  totalPoints: number
  weeklyPoints: number
  currentStreak: number
  allTimePlans: number
  topBadges: BadgeId[]
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ScoreUpdateResult {
  pointsEarned: number
  newBadges: Badge[]
  totalPoints: number
  currentStreak: number
  breakdown: { reason: string; points: number }[]
}