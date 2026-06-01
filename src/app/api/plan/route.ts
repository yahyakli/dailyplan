import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { buildPrompt } from '@/lib/buildPrompt'
import { parseSchedule } from '@/lib/parseSchedule'
import { connectDB } from '@/lib/mongodb'
import { Plan } from '@/models/Plan'
import { User } from '@/models/User'
import { AICache } from '@/models/AICache'
import { AILog } from '@/models/AILog'
import { sha256 } from '@/lib/hash'
import {
  findInternalConflicts,
  calculateAvailableSlots,
  timeToMinutes,
  minutesToTime,
} from '@/lib/timeValidation'
import {
  checkTimeConflicts,
  createTimeSlots,
  getOccupiedTimeSlots,
  deleteTimeSlotsForPlan,
} from '@/lib/timeSlots.server'
import type { Block, GeneratedPlan } from '@/lib/types'
import { calculateXP } from '@/lib/scoring'
import { runBadgeCheck } from '@/lib/badges'

import { getAIProvider } from '@/lib/ai'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { tasks: braindump, startTime, endTime, context, date, locale, resolution } = await req.json()
    const selectedTags = context ? context.split(',') : []

    // 1. Authentication & Rate Limiting
    const session = await auth()
    await connectDB()
    
    let userId: string | null = null
    let user = null
    let guestSessionId = req.cookies.get('guestSessionId')?.value || 'anonymous'
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'

    if (session?.user?.email) {
      user = await User.findOne({ email: session.user.email })
      if (user) userId = user._id.toString()
    }

    // Daily Limit Check
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const generationCount = await AILog.countDocuments({
      $or: userId ? [{ userId }] : [{ guestSessionId }, { ip }],
      createdAt: { $gte: todayStart }
    })

    const limit = userId ? 10 : 3
    if (generationCount >= limit) {
      return NextResponse.json(
        { error: `Daily limit reached (${limit} generations). Please try again tomorrow.` },
        { status: 429 }
      )
    }

    // 2. Prompt Caching
    const promptString = `${braindump}|${date}|${startTime}|${endTime}|${context}|${locale}`
    const promptHash = sha256(promptString)
    
    const cachedResponse = await AICache.findOne({ promptHash })
    let planData: GeneratedPlan

    if (cachedResponse) {
      console.log('Serving AI response from cache')
      planData = cachedResponse.response
    } else {
      // 3. AI Generation
      const providerId = 'groq'
      const provider = getAIProvider(providerId)
      const apiKey = process.env.GROQ_API_KEY

      if (!apiKey) {
        return NextResponse.json(
          { error: 'AI generation is currently unavailable. Please contact the administrator.' },
          { status: 503 }
        )
      }

      const { systemPrompt, userPrompt } = buildPrompt(braindump, startTime, endTime, context, date, locale)
      const aiResponse = await provider.generateResponse({ systemPrompt, userPrompt }, apiKey)
      planData = parseSchedule(aiResponse.content)

      // Save to cache
      await AICache.create({ promptHash, response: planData })

      // Log generation
      await AILog.create({
        userId,
        guestSessionId: userId ? undefined : guestSessionId,
        ip,
        model: 'llama-3.1-70b-versatile',
        tokens: aiResponse.usage?.totalTokens || 0
      })
    }

    // 4. Post-processing & Validation
    // Programmatic gap enforcement (ensure 10m gap)
    planData.tasks.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
    for (let i = 0; i < planData.tasks.length - 1; i++) {
      const current = planData.tasks[i]
      const next = planData.tasks[i + 1]
      const currentEndMins = timeToMinutes(current.endTime)
      const nextStartMins = timeToMinutes(next.startTime)
      
      if (nextStartMins < currentEndMins + 10) {
        const newStartMins = currentEndMins + 10
        const duration = timeToMinutes(next.endTime) - nextStartMins
        next.startTime = minutesToTime(newStartMins)
        next.endTime = minutesToTime(newStartMins + duration)
      }
    }

    // Validate boundaries
    const dayEndMins = timeToMinutes(endTime)
    const validTasks = planData.tasks.filter(t => timeToMinutes(t.endTime) <= dayEndMins)
    const overflow = planData.tasks.filter(t => timeToMinutes(t.endTime) > dayEndMins).map(t => t.title)

    // Check internal conflicts
    const blocksAsBlocks: Block[] = validTasks.map((t, i) => ({
      ...t,
      status: 'todo',
      xpValue: t.xpValue || 10,
      order: i,
    }))

    const internalConflicts = findInternalConflicts(blocksAsBlocks)
    if (internalConflicts.length > 0) {
      return NextResponse.json({ error: 'Generated schedule has internal conflicts' }, { status: 400 })
    }

    // 5. External Conflict Detection
    let existingPlanId: string | null = null
    if (userId) {
      const existingPlan = await Plan.findOne({ userId, planDate: new Date(date) })
      if (existingPlan) existingPlanId = existingPlan._id.toString()
    }

    if (userId && resolution !== 'replace') {
      const { hasConflicts, conflicts } = await checkTimeConflicts(userId, date, blocksAsBlocks, existingPlanId || undefined)
      if (hasConflicts) {
        const occupied = conflicts.map(c => ({
          startTime: c.existingTime.split('-')[0],
          endTime: c.existingTime.split('-')[1],
        }))
        const availableSlots = calculateAvailableSlots(startTime, endTime, occupied, 30)

        return NextResponse.json({
          error: 'Time conflict detected',
          conflicts,
          availableSlots,
          suggestion: availableSlots.length > 0 ? `Available: ${availableSlots.map(s => `${s.startTime}-${s.endTime}`).join(', ')}` : 'No gaps found'
        }, { status: 409 })
      }
    }

    // 6. Persistence
    if (userId) {
      // If resolution is replace, or we just want to ensure one plan per date
      await Plan.deleteMany({ userId, planDate: new Date(date) })
      // deleteMany doesn't trigger hooks, so delete slots manually
      if (existingPlanId) await deleteTimeSlotsForPlan(existingPlanId)

      const savedPlan = await Plan.create({
        userId,
        title: planData.planTitle,
        braindump,
        planDate: new Date(date),
        startTime,
        endTime,
        contextTags: selectedTags,
        tasks: blocksAsBlocks,
        status: 'draft',
        totalXPEarned: 0,
        completionRate: 0,
        isGuestPlan: false
      })

      await createTimeSlots(userId, savedPlan._id.toString(), date, blocksAsBlocks)
      
      // 7. Gamification: Reward plan creation
      const { xp, reason } = calculateXP('plan_created')
      user.points += xp
      await user.save()

      await XPLog.create({
        userId,
        xp,
        reason,
        earnedAt: new Date()
      })

      const { newBadges } = await runBadgeCheck(userId)

      // Return the saved plan format
      return NextResponse.json({
        ...savedPlan.toObject(),
        overflow,
        aiTip: planData.aiTip,
        newBadges: newBadges.length > 0 ? newBadges : undefined,
        pointsEarned: xp
      })
    }

    // Guest response
    return NextResponse.json({
      title: planData.planTitle,
      planDate: date,
      startTime,
      endTime,
      tasks: blocksAsBlocks,
      overflow,
      aiTip: planData.aiTip,
      status: 'draft',
      isGuestPlan: true
    })

  } catch (err: any) {
    console.error('Plan API error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to check available time slots for a date
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const dayStart = searchParams.get('dayStart') || '09:00'
    const dayEnd = searchParams.get('dayEnd') || '18:00'

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

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

    // Get occupied time slots
    const occupiedSlots = await getOccupiedTimeSlots(user._id.toString(), date)

    // Calculate available slots
    const availableSlots = calculateAvailableSlots(
      dayStart,
      dayEnd,
      occupiedSlots,
      30
    )

    return NextResponse.json({
      date,
      occupiedSlots,
      availableSlots,
    })
  } catch (err: unknown) {
    console.error('GET /api/plan error:', err)
    const message = err instanceof Error ? err.message : 'Failed to fetch time slots'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
