import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { Plan } from '@/models/Plan'
import { Score } from '@/models/Score'
import {
  BlockProgress,
  updateBlockProgress,
  getPlanProgress,
  canUndoBlockCompletion,
  undoBlockCompletion,
} from '@/models/BlockProgress'
// Time utilities not needed in this route

export const runtime = 'nodejs'

// Types for request body
interface ProgressUpdateRequest {
  planDate: string
  blockIndex: number
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'undo'
  completionPercentage?: number
  notes?: string
  actualDuration?: number
}

interface ProgressResponse {
  blockIndex: number
  status: string
  completionPercentage: number
  startedAt?: Date
  completedAt?: Date
  pointsEarned?: number
  canUndo?: boolean
  undoWindowRemaining?: number
}

/**
 * GET /api/plan/progress?planDate=2025-01-15
 *
 * Get all progress entries for a plan
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const planDate = searchParams.get('planDate')

    if (!planDate) {
      return NextResponse.json(
        { error: 'planDate parameter is required' },
        { status: 400 }
      )
    }

    const session = await getServerSession()
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

    // Find the plan
    const plan = await Plan.findOne({ userId: user._id, date: planDate, isArchived: false })
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const progressEntries = await getPlanProgress(
      user._id.toString(),
      plan._id.toString()
    )

    // Calculate stats
    const completedCount = progressEntries.filter(
      (p) => p.status === 'completed'
    ).length
    const inProgressCount = progressEntries.filter(
      (p) => p.status === 'in_progress'
    ).length
    const completionPercentage = plan.blocks.length
      ? Math.round((completedCount / plan.blocks.length) * 100)
      : 0

    // Check undo availability for completed blocks
    const progressWithUndo = await Promise.all(
      progressEntries.map(async (entry) => {
        if (entry.status === 'completed') {
          const { canUndo } = await canUndoBlockCompletion(
            user._id.toString(),
            plan._id.toString(),
            entry.blockIndex
          )
          return {
            ...entry,
            canUndo,
            undoWindowRemaining: canUndo
              ? Math.max(
                  0,
                  5 * 60 -
                    (new Date().getTime() - new Date(entry.completedAt!).getTime()) /
                      1000
                )
              : 0,
          }
        }
        return entry
      })
    )

    return NextResponse.json({
      planDate,
      totalBlocks: plan.blocks.length,
      completedBlocks: completedCount,
      inProgressBlocks: inProgressCount,
      completionPercentage,
      progress: progressWithUndo,
    })
  } catch (err: unknown) {
    console.error('GET /api/plan/progress error:', err)
    const message =
      err instanceof Error ? err.message : 'Failed to fetch progress'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/plan/progress
 *
 * Update block progress
 */
export async function POST(req: NextRequest) {
  try {
    const body: ProgressUpdateRequest = await req.json()
    const { planDate, blockIndex, status, completionPercentage, notes, actualDuration } = body

    if (!planDate || blockIndex === undefined || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: planDate, blockIndex, status' },
        { status: 400 }
      )
    }

    const session = await getServerSession()
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

    // Find the plan
    const plan = await Plan.findOne({ userId: user._id, date: planDate, isArchived: false })
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Validate block index
    if (blockIndex < 0 || blockIndex >= plan.blocks.length) {
      return NextResponse.json(
        { error: 'Invalid block index' },
        { status: 400 }
      )
    }

    const block = plan.blocks[blockIndex]
    const userId = user._id.toString()
    const planId = plan._id.toString()

    // Handle undo request
    if (status === 'undo') {
      try {
        const progress = await undoBlockCompletion(userId, planId, blockIndex)

        // Deduct points for undoing completion
        const score = await Score.findOne({ userId })
        if (score) {
          const pointsToDeduct = calculateBlockPoints(block, true)
          score.totalPoints = Math.max(0, score.totalPoints - pointsToDeduct)
          await score.save()
        }

        return NextResponse.json({
          blockIndex,
          status: progress.status,
          completionPercentage: progress.completionPercentage,
          pointsDeducted: calculateBlockPoints(block, true),
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to undo'
        return NextResponse.json({ error: message }, { status: 400 })
      }
    }

    // Validate status transition
    const currentProgress = await BlockProgress.findOne({
      userId,
      planId,
      blockIndex,
    })

    const currentStatus = currentProgress?.status || 'pending'

    // Prevent invalid transitions (undo is handled above)
    if (currentStatus === 'completed') {
      return NextResponse.json(
        { error: 'Task already completed. Use undo to revert.' },
        { status: 400 }
      )
    }

    // Calculate completion percentage based on status
    let finalCompletionPercentage = completionPercentage
    if (status === 'completed') {
      finalCompletionPercentage = 100
    } else if (status === 'pending') {
      finalCompletionPercentage = 0
    } else if (status === 'in_progress' && !completionPercentage) {
      finalCompletionPercentage = 50 // Default to 50% if not specified
    }

    // Update progress
    const progress = await updateBlockProgress(userId, planId, blockIndex, {
      status,
      completionPercentage: finalCompletionPercentage,
      notes,
      actualDuration,
    })

    // Calculate points earned
    let pointsEarned = 0
    let isNewCompletion = false

    if (status === 'completed' && currentStatus !== 'completed') {
      isNewCompletion = true
      pointsEarned = calculateBlockPoints(block, false)

      // Update score
      const score = await Score.findOne({ userId })
      if (score) {
        score.totalPoints += pointsEarned
        score.weeklyPoints += pointsEarned
        await score.save()
      }
    } else if (status === 'in_progress' && currentStatus === 'pending') {
      // Small bonus for starting a task
      pointsEarned = 2
      const score = await Score.findOne({ userId })
      if (score) {
        score.totalPoints += pointsEarned
        score.weeklyPoints += pointsEarned
        await score.save()
      }
    }

    // Check if all blocks are completed
    const allProgress = await getPlanProgress(userId, planId)
    const allCompleted = plan.blocks.every(
      (block: any, idx: number) => allProgress.find((p) => p.blockIndex === idx)?.status === 'completed'
    )

    if (allCompleted) {
      // Bonus for completing entire plan
      const planCompletionBonus = 10
      const score = await Score.findOne({ userId })
      if (score) {
        score.totalPoints += planCompletionBonus
        score.weeklyPoints += planCompletionBonus
        await score.save()
      }
      pointsEarned += planCompletionBonus
    }

    // Check undo availability
    const { canUndo, completedAt } =
      status === 'completed'
        ? await canUndoBlockCompletion(userId, planId, blockIndex)
        : { canUndo: false, completedAt: undefined }

    const undoWindowRemaining = canUndo
      ? Math.max(
          0,
          5 * 60 - (new Date().getTime() - (completedAt?.getTime() || 0)) / 1000
        )
      : 0

    const response: ProgressResponse = {
      blockIndex,
      status: progress.status,
      completionPercentage: progress.completionPercentage,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
      pointsEarned: isNewCompletion ? pointsEarned : undefined,
      canUndo,
      undoWindowRemaining: canUndo ? Math.round(undoWindowRemaining) : undefined,
    }

    return NextResponse.json(response)
  } catch (err: unknown) {
    console.error('POST /api/plan/progress error:', err)
    const message =
      err instanceof Error ? err.message : 'Failed to update progress'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Calculate points for a block
 */
function calculateBlockPoints(
  block: { category: string; priority: string },
  isUndo: boolean
): number {
  if (isUndo) {
    // Return the same points that were awarded
    let points = 5 // Base
    if (block.priority === 'high') points += 5
    if (block.category === 'deep-work') points += 2
    return points
  }

  // Award points
  let points = 5 // Base for completing any task

  if (block.priority === 'high') {
    points += 5 // Bonus for high priority
  }

  if (block.category === 'deep-work') {
    points += 2 // Bonus for deep work
  }

  return points
}

/**
 * PATCH /api/plan/progress
 *
 * Batch update multiple blocks (for bulk operations)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { planDate, updates } = body

    if (!planDate || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Missing required fields: planDate, updates array' },
        { status: 400 }
      )
    }

    const session = await getServerSession()
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

    const plan = await Plan.findOne({ userId: user._id, date: planDate, isArchived: false })
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const userId = user._id.toString()
    const planId = plan._id.toString()

    // Process updates
    const results = await Promise.all(
      updates.map(async (update: any) => {
        try {
          const progress = await updateBlockProgress(
            userId,
            planId,
            update.blockIndex,
            {
              status: update.status,
              completionPercentage: update.completionPercentage,
              notes: update.notes,
            }
          )
          return { success: true, blockIndex: update.blockIndex, progress }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to update'
          return { success: false, blockIndex: update.blockIndex, error: message }
        }
      })
    )

    return NextResponse.json({
      planDate,
      results,
      summary: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    })
  } catch (err: unknown) {
    console.error('PATCH /api/plan/progress error:', err)
    const message =
      err instanceof Error ? err.message : 'Failed to batch update'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
