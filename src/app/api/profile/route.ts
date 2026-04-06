import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { Score } from '@/models/Score'
import { Streak } from '@/models/Streak'
import { Achievement } from '@/models/Achievement'
import type { BadgeId } from '@/lib/types'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = user._id

    // Fetch all gamification data in parallel
    const [score, streak, achievement] = await Promise.all([
      Score.findOne({ userId }).lean(),
      Streak.findOne({ userId }).lean(),
      Achievement.findOne({ userId }).lean(),
    ])

    return NextResponse.json({
      totalPoints:       score?.totalPoints ?? 0,
      weeklyPoints:      score?.weeklyPoints ?? 0,
      allTimePlans:      score?.allTimePlans ?? 0,
      perfectDaysInARow: score?.perfectDaysInARow ?? 0,
      currentStreak:     streak?.currentStreak ?? 0,
      longestStreak:     streak?.longestStreak ?? 0,
      unlockedBadges:    (achievement?.badges ?? []).map((b: { id: BadgeId; unlockedAt: Date }) => ({
        id: b.id,
        unlockedAt: b.unlockedAt?.toISOString?.() ?? new Date().toISOString(),
      })),
    })

  } catch (err) {
    console.error('Profile API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
