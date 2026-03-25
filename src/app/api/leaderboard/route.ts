import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import { Score } from '@/models/Score'
import { Streak } from '@/models/Streak'
import { Achievement } from '@/models/Achievement'
import { User } from '@/models/User'
import type { LeaderboardEntry, BadgeId } from '@/lib/types'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await connectDB()

    // Get top 50 scores
    const topScores = await Score.find({})
      .sort({ totalPoints: -1 })
      .limit(50)
      .lean()

    // Get related data
    const userIds = topScores.map(s => s.userId)
    const [users, streaks, achievements] = await Promise.all([
      User.find({ _id: { $in: userIds } }).lean(),
      Streak.find({ userId: { $in: userIds } }).lean(),
      Achievement.find({ userId: { $in: userIds } }).lean(),
    ])

    const userMap   = Object.fromEntries(users.map(u => [u._id.toString(), u]))
    const streakMap = Object.fromEntries(streaks.map(s => [s.userId.toString(), s]))
    const achieveMap = Object.fromEntries(achievements.map(a => [a.userId.toString(), a]))

    const leaderboard: LeaderboardEntry[] = topScores.map((score, idx) => {
      const uid    = score.userId.toString()
      const user   = userMap[uid]
      const streak = streakMap[uid]
      const achieve = achieveMap[uid]

      const topBadges: BadgeId[] = (achieve?.badges || [])
        .slice(-3)
        .map((b: { id: BadgeId }) => b.id)

      return {
        rank:          idx + 1,
        userId:        uid,
        name:          user?.name || 'Anonymous',
        image:         user?.image,
        totalPoints:   score.totalPoints,
        weeklyPoints:  score.weeklyPoints,
        currentStreak: streak?.currentStreak || 0,
        allTimePlans:  score.allTimePlans,
        topBadges,
      }
    })

    return NextResponse.json(leaderboard)

  } catch (err) {
    console.error('Leaderboard error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}