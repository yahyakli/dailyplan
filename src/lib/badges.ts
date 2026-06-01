import { connectDB } from './mongodb'
import { User } from '@/models/User'
import { Badge } from '@/models/Badge'
import { Plan } from '@/models/Plan'
import { XPLog } from '@/models/XPLog'
import { checkBadges, calculateXP } from './scoring'
import mongoose from 'mongoose'

/**
 * Orchestrates a full badge and XP check for a user.
 * Triggered after plan creation, completion, or task status change.
 */
export async function runBadgeCheck(userId: string) {
  await connectDB()

  // 1. Fetch User and unearned badges
  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')

  const earnedBadgeIds = user.badges.map((b: any) => b.badgeId)
  const unearnedBadges = await Badge.find({ _id: { $nin: earnedBadgeIds } })

  if (unearnedBadges.length === 0) return { newBadges: [] }

  // 2. Aggregate Stats
  const stats = await aggregateUserStats(userId)

  // 3. Evaluate Conditions
  const newlyEarnedBadges = await checkBadges(userId, unearnedBadges, stats)

  if (newlyEarnedBadges.length === 0) return { newBadges: [] }

  // 4. Award Badges & XP
  const updates: any[] = []
  let totalXPReward = 0

  for (const badge of newlyEarnedBadges) {
    user.badges.push({
      badgeId: badge._id,
      earnedAt: new Date()
    })
    totalXPReward += badge.xpReward
    
    updates.push(XPLog.create({
      userId,
      xp: badge.xpReward,
      reason: `Earned badge: ${badge.name.en}`,
      earnedAt: new Date()
    }))
  }

  user.points += totalXPReward
  await user.save()
  await Promise.all(updates)

  return { newBadges: newlyEarnedBadges }
}

/**
 * Aggregates all necessary stats for badge evaluation.
 */
async function aggregateUserStats(userId: string) {
  const user = await User.findById(userId)
  const plans = await Plan.find({ userId })
  
  // Basic counts
  const planCount = plans.length
  const streakCurrent = user?.streakCurrent || 0
  const totalXP = user?.points || 0
  
  // Task aggregates
  let totalCompletedTasks = 0
  let criticalTaskCount = 0
  let earlyStartCount = 0
  let lateEndCount = 0
  const contextCounts: Record<string, number> = {}
  let perfectDayCount = 0
  
  // Context tag tracking
  const allPossibleContexts = ['low_energy', 'high_energy', 'deep_work', 'meetings', 'creative', 'exercise', 'admin']
  const usedContexts = new Set<string>()

  for (const plan of plans) {
    const completedTasks = plan.tasks.filter((t: any) => t.status === 'done')
    totalCompletedTasks += completedTasks.length
    criticalTaskCount += completedTasks.filter((t: any) => t.priority === 'critical').length
    
    if (plan.startTime <= '07:00') earlyStartCount++
    if (plan.endTime >= '22:00') lateEndCount++
    
    plan.contextTags.forEach((tag: string) => {
      contextCounts[tag] = (contextCounts[tag] || 0) + 1
      usedContexts.add(tag)
    })

    if (plan.tasks.length > 0 && plan.tasks.every((t: any) => t.status === 'done')) {
      perfectDayCount++
    }
  }

  return {
    planCount,
    streakCurrent,
    taskCount: totalCompletedTasks,
    totalXP,
    criticalTaskCount,
    earlyStartCount,
    lateEndCount,
    contextCounts,
    allContextsUsed: allPossibleContexts.every(c => usedContexts.has(c)),
    perfectDayCount,
    perfectStreak: 0, // Needs more complex logic tracking consecutive perfect days
    languagesSwitched: 0, // Placeholder
    darkModeDays: 0, // Placeholder
    referralCount: 0, // Placeholder
  }
}
