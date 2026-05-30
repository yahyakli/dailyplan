// ─── Schedule Types ───────────────────────────────────────────────────────────

export type BlockCategory = 'deep-work' | 'communication' | 'admin' | 'personal' | 'break'
export type Priority = 'high' | 'medium' | 'low'

export interface Block {
  id?: string
  startTime: string   // HH:MM
  endTime: string     // HH:MM
  title: string
  description?: string
  category?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'todo' | 'in_progress' | 'done' | 'skipped'
  xpValue: number
  order: number
}

export interface Plan {
  _id?: string        // MongoDB ID
  title: string
  braindump: string
  planDate: string
  startTime: string
  endTime: string
  contextTags: string[]
  tasks: Block[]
  status: 'draft' | 'active' | 'completed' | 'missed'
  totalXPEarned: number
  completionRate: number
  isGuestPlan: boolean
  createdAt?: string
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