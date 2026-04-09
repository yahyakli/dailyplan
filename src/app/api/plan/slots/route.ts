import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import { User } from '@/models/User'
import { formatDuration } from '@/lib/timeValidation'
import { getOccupiedTimeSlots, getAvailableTimeSlots } from '@/lib/timeSlots.server'

export const runtime = 'nodejs'

/**
 * GET /api/plan/slots?date=2025-01-15&dayStart=09:00&dayEnd=18:00
 *
 * Returns occupied and available time slots for a specific date
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const dayStart = searchParams.get('dayStart') || '09:00'
    const dayEnd = searchParams.get('dayEnd') || '18:00'
    const excludePlanId = searchParams.get('excludePlanId') || undefined
    const minDuration = parseInt(searchParams.get('minDuration') || '30', 10)

    // Validate date parameter
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required (YYYY-MM-DD format)' },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Check authentication
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

    const userId = user._id.toString()

    // Fetch occupied time slots
    const occupiedSlots = await getOccupiedTimeSlots(userId, date, excludePlanId)

    // Calculate available time slots
    const availableSlots = await getAvailableTimeSlots(
      userId,
      date,
      dayStart,
      dayEnd,
      excludePlanId,
      minDuration
    )

    // Calculate total availability stats
    const totalDayMinutes =
      (parseInt(dayEnd.split(':')[0]) - parseInt(dayStart.split(':')[0])) * 60 +
      (parseInt(dayEnd.split(':')[1]) - parseInt(dayStart.split(':')[1]))

    const occupiedMinutes = occupiedSlots.reduce((total, slot) => {
      const [startHour, startMin] = slot.startTime.split(':').map(Number)
      const [endHour, endMin] = slot.endTime.split(':').map(Number)
      return total + (endHour - startHour) * 60 + (endMin - startMin)
    }, 0)

    const availableMinutes = totalDayMinutes - occupiedMinutes
    const utilizationPercentage = totalDayMinutes
      ? Math.round((occupiedMinutes / totalDayMinutes) * 100)
      : 0

    return NextResponse.json({
      date,
      dayRange: { start: dayStart, end: dayEnd },
      stats: {
        totalMinutes: totalDayMinutes,
        occupiedMinutes,
        availableMinutes,
        utilizationPercentage,
      },
      occupiedSlots: occupiedSlots.map((slot) => ({
        ...slot,
        duration: formatDuration(
          (parseInt(slot.endTime.split(':')[0]) - parseInt(slot.startTime.split(':')[0])) * 60 +
          (parseInt(slot.endTime.split(':')[1]) - parseInt(slot.startTime.split(':')[1]))
        ),
      })),
      availableSlots: availableSlots.map((slot) => ({
        ...slot,
        durationFormatted: formatDuration(slot.duration),
      })),
      suggestions: generateSuggestions(availableSlots, minDuration),
    })
  } catch (err: unknown) {
    console.error('GET /api/plan/slots error:', err)
    const message = err instanceof Error ? err.message : 'Failed to fetch time slots'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Generate helpful suggestions based on available slots
 */
function generateSuggestions(
  availableSlots: Array<{ startTime: string; endTime: string; duration: number }>,
  minDuration: number
): string[] {
  const suggestions: string[] = []

  if (availableSlots.length === 0) {
    suggestions.push('No available time slots in the selected range.')
    return suggestions
  }

  // Find largest available slot
  const largestSlot = availableSlots.reduce((max, slot) =>
    slot.duration > max.duration ? slot : max
  )

  if (largestSlot) {
    suggestions.push(
      `Largest available block: ${largestSlot.startTime}-${largestSlot.endTime} (${formatDuration(largestSlot.duration)})`
    )
  }

  // Suggest based on common task durations
  const commonDurations = [30, 60, 90, 120]
  commonDurations.forEach((duration) => {
    const fittingSlots = availableSlots.filter((slot) => slot.duration >= duration)
    if (fittingSlots.length > 0) {
      suggestions.push(
        `${fittingSlots.length} slot(s) can fit a ${duration}min task`
      )
    }
  })

  return suggestions
}
