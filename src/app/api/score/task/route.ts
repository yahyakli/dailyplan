import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { Score } from '@/models/Score'
import { Achievement } from '@/models/Achievement'
import type { Plan, Block, BadgeId } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { block, plan, allCompleted } = await req.json() as { block: Block, plan: Plan, allCompleted: boolean }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const userId = user._id

    let score = await Score.findOne({ userId })
    if (!score) score = await Score.create({ userId })

    let achievement = await Achievement.findOne({ userId })
    if (!achievement) achievement = await Achievement.create({ userId, badges: [] })

    let pointsEarned = 5
    const breakdown = [{ reason: `Completed: ${block.title}`, points: 5 }]

    if (block.priority === 'high') {
      pointsEarned += 5
      breakdown.push({ reason: 'High priority task bonus', points: 5 })
    }

    if (block.category === 'deep-work') {
      pointsEarned += 2
      breakdown.push({ reason: 'Deep work bonus', points: 2 })
    }

    if (allCompleted) {
      pointsEarned += 10
      breakdown.push({ reason: 'All tasks completed for the day!', points: 10 })
    }

    score.totalPoints += pointsEarned
    score.weeklyPoints += pointsEarned
    score.lastUpdated = new Date()
    await score.save()

    return NextResponse.json({
      pointsEarned,
      newBadges: [], // Badges can be checked here in the future
      totalPoints: score.totalPoints,
      breakdown,
    })

  } catch (err) {
    console.error('Score task error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
