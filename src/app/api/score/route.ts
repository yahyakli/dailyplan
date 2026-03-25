import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { Score } from '@/models/Score'
import { Streak } from '@/models/Streak'
import { Achievement } from '@/models/Achievement'
import { calculatePoints, checkNewBadges, updateStreak, BADGES } from '@/lib/scoring'
import type { Plan, BadgeId } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const plan: Plan = await req.json()

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const userId = user._id

    // Get or create score, streak, achievement docs
    let score = await Score.findOne({ userId })
    if (!score) score = await Score.create({ userId })

    let streak = await Streak.findOne({ userId })
    if (!streak) streak = await Streak.create({ userId })

    let achievement = await Achievement.findOne({ userId })
    if (!achievement) achievement = await Achievement.create({ userId, badges: [] })

    // Update streak
    const { currentStreak, increment } = updateStreak(streak.lastPlanDate)
    if (increment) {
      streak.currentStreak = (streak.currentStreak || 0) + currentStreak
    } else if (currentStreak === 1 && !increment) {
      // Reset
      streak.currentStreak = 1
    }
    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak)
    streak.lastPlanDate = new Date().toISOString().split('T')[0]
    await streak.save()

    // Calculate points
    const { total: pointsEarned, breakdown } = calculatePoints(
      plan,
      score.allTimePlans,
      streak.currentStreak
    )

    // Check for new badges
    const existingIds = achievement.badges.map((b: { id: BadgeId }) => b.id)
    const newBadges = checkNewBadges(
      plan,
      score.allTimePlans,
      streak.currentStreak,
      existingIds,
      score.allTimePlans // simplified: using allTimePlans as perfect days proxy
    )

    // Update achievement
    if (newBadges.length > 0) {
      achievement.badges.push(...newBadges.map(b => ({ id: b.id, unlockedAt: new Date() })))
      await achievement.save()
    }

    // Update score
    score.totalPoints += pointsEarned
    score.weeklyPoints += pointsEarned
    score.allTimePlans += 1
    score.lastUpdated = new Date()
    await score.save()

    return NextResponse.json({
      pointsEarned,
      newBadges,
      totalPoints: score.totalPoints,
      currentStreak: streak.currentStreak,
      breakdown,
    })

  } catch (err) {
    console.error('Score update error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}