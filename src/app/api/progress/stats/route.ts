import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { Plan } from '@/models/Plan'
import { BlockProgress } from '@/models/BlockProgress'

export const runtime = 'nodejs'

/**
 * GET /api/progress/stats
 *
 * Returns comprehensive user progress statistics for the dashboard
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectDB()
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = user._id.toString()

    // Get all plans for this user
    const plans = await Plan.find({ userId }).lean()
    const planIds = plans.map((p) => p._id.toString())

    // Get all block progress entries
    const progressEntries = await BlockProgress.find({
      userId,
      planId: { $in: planIds },
    }).lean()

    const completedBlocks = progressEntries.filter(
      (p) => p.status === 'completed'
    ).length
    const totalBlocks = plans.reduce((sum, plan) => sum + (plan.tasks?.length || 0), 0)

    // Calculate completion rate
    const completionRate = totalBlocks ? Math.round((completedBlocks / totalBlocks) * 100) : 0

    // Calculate average blocks per plan
    const averageBlocksPerPlan = plans.length ? totalBlocks / plans.length : 0

    // Calculate completed plans (plans where all blocks are completed)
    let completedPlans = 0
    for (const plan of plans) {
      const planProgress = progressEntries.filter(
        (p) => p.planId.toString() === plan._id.toString()
      )
      const planBlockCount = plan.tasks?.length || 0
      const planCompletedCount = planProgress.filter(
        (p) => p.status === 'completed'
      ).length

      if (planBlockCount > 0 && planCompletedCount === planBlockCount) {
        completedPlans++
      }
    }

    // Calculate category breakdown
    const categoryBreakdown: Record<
      string,
      { total: number; completed: number; rate: number }
    > = {}

    // Updated categories
    const categories = ['work', 'health', 'personal', 'learning', 'admin', 'creative']
    categories.forEach((cat) => {
      categoryBreakdown[cat] = { total: 0, completed: 0, rate: 0 }
    })

    // Aggregate by category
    for (const plan of plans) {
      if (!plan.tasks) continue

      for (let i = 0; i < plan.tasks.length; i++) {
        const task = plan.tasks[i]
        const category = task.category || 'personal'

        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { total: 0, completed: 0, rate: 0 }
        }

        categoryBreakdown[category].total++

        const taskProgress = progressEntries.find(
          (p) =>
            p.planId.toString() === plan._id.toString() &&
            p.blockIndex === i
        )

        if (taskProgress?.status === 'completed') {
          categoryBreakdown[category].completed++
        }
      }
    }

    // Calculate rates for each category
    for (const cat of Object.keys(categoryBreakdown)) {
      const data = categoryBreakdown[cat]
      data.rate = data.total ? Math.round((data.completed / data.total) * 100) : 0
    }

    // Calculate weekly progress (last 7 days)
    const weeklyProgress: Array<{
      date: string
      completed: number
      total: number
      rate: number
    }> = []

    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      // Find plans for this date
      const dayPlans = plans.filter((p) => p.planDate.toISOString().split('T')[0] === dateStr)
      const dayPlanIds = dayPlans.map((p) => p._id.toString())

      const dayTotal = dayPlans.reduce(
        (sum, p) => sum + (p.tasks?.length || 0),
        0
      )

      const dayCompleted = progressEntries.filter(
        (p) =>
          dayPlanIds.includes(p.planId.toString()) &&
          p.status === 'completed'
      ).length

      weeklyProgress.push({
        date: dateStr,
        completed: dayCompleted,
        total: dayTotal,
        rate: dayTotal ? Math.round((dayCompleted / dayTotal) * 100) : 0,
      })
    }

    // Build response
    const stats = {
      totalPlans: plans.length,
      completedPlans,
      totalBlocks,
      completedBlocks,
      completionRate,
      averageBlocksPerPlan,
      categoryBreakdown,
      weeklyProgress,
      streak: {
        current: user.streakCurrent || 0,
        longest: user.streakLongest || 0,
      },
    }

    return NextResponse.json(stats)
  } catch (err: unknown) {
    console.error('GET /api/progress/stats error:', err)
    const message =
      err instanceof Error ? err.message : 'Failed to fetch progress statistics'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
