import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { buildPrompt } from '@/lib/buildPrompt'
import { parseSchedule } from '@/lib/parseSchedule'
import { connectDB } from '@/lib/mongodb'
import { Plan } from '@/models/Plan'
import { User } from '@/models/User'
import {
  findInternalConflicts,
  isValidTimeRange,
  calculateAvailableSlots,
} from '@/lib/timeValidation'
import {
  checkTimeConflicts,
  createTimeSlots,
  getOccupiedTimeSlots,
  deleteTimeSlotsForPlan,
} from '@/lib/timeSlots.server'
import type { Block } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { tasks, startTime, endTime, context, date, locale, apiKey: userApiKey } = await req.json()

    const apiKey = userApiKey || process.env.MISTRAL_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No Mistral API key provided. Please add one in Settings.' },
        { status: 401 }
      )
    }

    if (!tasks || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate time range
    if (!isValidTimeRange(startTime, endTime)) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Build prompt and call Mistral
    const { systemPrompt, userPrompt } = buildPrompt(
      tasks,
      startTime,
      endTime,
      context,
      date,
      locale
    )

    let response: Response | null = null
    const maxRetries = 5
    for (let i = 0; i < maxRetries; i++) {
      try {
        response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'mistral-small-latest',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 4096,
            response_format: { type: 'json_object' },
          }),
        })

        if (response.ok) break
        
        // If rate limited or service busy, wait and retry
        if ((response.status === 429 || response.status === 503) && i < maxRetries - 1) {
          // Exponential backoff with jitter: 2s, 4s, 8s, 16s... plus random jitter
          const baseDelay = Math.pow(2, i + 1) * 1000 
          const jitter = Math.random() * 1000
          const waitTime = baseDelay + jitter
          
          console.warn(`Mistral rate limit/busy (Status: ${response.status}). Retry ${i+1}/${maxRetries} in ${Math.round(waitTime)}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
      } catch (err) {
        console.error(`Mistral fetch attempt ${i+1} failed:`, err)
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }
      }
      
      break // Other errors or no more retries left
    }

    if (!response || !response.ok) {
      const error = response ? await response.json() : { message: 'Network error or timeout' }
      let message = error.message || 'Mistral API error'

      if (response?.status === 401) {
        message = 'Invalid Mistral API key configured on the server.'
      } else if (response?.status === 429) {
        message = 'Rate limit exceeded. Please try again in a moment.'
      } else if (response?.status === 422 || response?.status === 400) {
        if (
          message.toLowerCase().includes('violates') ||
          message.toLowerCase().includes('policy') ||
          message.toLowerCase().includes('safety')
        ) {
          message = 'Moderation policy violation.'
        }
      }

      return NextResponse.json({ error: message }, { status: response?.status || 500 })
    }

    const data = await response.json()
    const raw = data.choices[0].message.content
    const plan = parseSchedule(raw)

    // Validate blocks have valid time ranges
    for (const block of plan.blocks) {
      if (!isValidTimeRange(block.startTime, block.endTime)) {
        return NextResponse.json(
          { error: `Invalid time range for block: ${block.title}` },
          { status: 400 }
        )
      }
    }

    // Check for internal conflicts (blocks overlapping within the plan)
    const internalConflicts = findInternalConflicts(plan.blocks)
    if (internalConflicts.length > 0) {
      const conflictDetails = internalConflicts
        .map((c) => {
          const b1 = plan.blocks[c.index1]
          const b2 = plan.blocks[c.index2]
          return `${b1.title} (${b1.startTime}-${b1.endTime}) overlaps with ${b2.title} (${b2.startTime}-${b2.endTime})`
        })
        .join('; ')

      return NextResponse.json(
        {
          error: 'Generated schedule has overlapping blocks',
          details: conflictDetails,
        },
        { status: 400 }
      )
    }

    // Check if user is authenticated
    const session = await getServerSession()
    let userId: string | null = null
    let existingPlanId: string | null = null

    if (session?.user?.email) {
      await connectDB()
      const user = await User.findOne({ email: session.user.email })
      if (user) {
        userId = user._id.toString()

        // Check for existing plan on this date
        const existingPlan = await Plan.findOne({
          userId: user._id,
          date: plan.date,
        })

        if (existingPlan) {
          existingPlanId = existingPlan._id.toString()
        }
      }
    }

    // Check for time conflicts with other plans
    if (userId) {
      const { hasConflicts, conflicts } = await checkTimeConflicts(
        userId,
        plan.date,
        plan.blocks,
        existingPlanId || undefined
      )

      if (hasConflicts) {
        // Get available slots for suggestions
        const occupiedSlots = conflicts.map((c) => ({
          startTime: c.existingTime.split('-')[0],
          endTime: c.existingTime.split('-')[1],
        }))

        const availableSlots = calculateAvailableSlots(
          startTime,
          endTime,
          occupiedSlots,
          30
        )

        return NextResponse.json(
          {
            error: 'Time conflict detected',
            conflicts: conflicts.map((c) => ({
              blockTitle: c.blockTitle,
              blockTime: c.blockTime,
              existingPlanDate: c.existingPlanDate,
              existingBlockTitle: c.existingBlockTitle,
              existingTime: c.existingTime,
            })),
            suggestion:
              availableSlots.length > 0
                ? `Available time slots: ${availableSlots
                    .map((s) => `${s.startTime}-${s.endTime} (${s.duration}min)`)
                    .join(', ')}`
                : 'No available time slots in your selected range',
          },
          { status: 409 }
        )
      }
    }

    // If authenticated, save plan to MongoDB
    if (userId) {
      await connectDB()
      const user = await User.findOne({ email: session!.user!.email })
      if (user) {
        // Archive existing plans for this date
        const existingPlans = await Plan.find({ userId: user._id, date: plan.date, isArchived: false })
        
        if (existingPlans.length > 0) {
          await Plan.updateMany(
            { userId: user._id, date: plan.date, isArchived: false },
            { isArchived: true }
          )
          
          // Delete time slots for archived plans to avoid conflicts with the new one
          for (const oldPlan of existingPlans) {
            await deleteTimeSlotsForPlan(oldPlan._id.toString())
          }
        }

        // Create new plan
        const savedPlan = await Plan.create({
          ...plan,
          userId: user._id,
          rawInput: tasks,
          isArchived: false
        })

        // Create time slots for the new plan blocks
        if (savedPlan && savedPlan.blocks.length > 0) {
          await createTimeSlots(
            userId,
            savedPlan._id.toString(),
            plan.date,
            savedPlan.blocks as Block[]
          )
        }
      }
    }

    return NextResponse.json(plan)
  } catch (err: unknown) {
    console.error('Plan API error:', err)
    const message = err instanceof Error ? err.message : 'Failed to generate schedule'

    // Bubble up parsing and format errors to frontend
    if (
      message.includes('Unexpected token') ||
      message.includes('Invalid schedule') ||
      message.includes('JSON')
    ) {
      return NextResponse.json(
        { error: 'Invalid schedule format from AI.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
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
