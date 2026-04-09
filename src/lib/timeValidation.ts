import type { Block } from './types'

export interface TimeRange {
  startTime: string // HH:MM
  endTime: string // HH:MM
}

export interface ConflictInfo {
  blockTitle: string
  blockTime: string
  existingPlanDate: string
  existingBlockTitle: string
  existingTime: string
}

export interface AvailableSlot {
  startTime: string
  endTime: string
  duration: number // in minutes
}

/**
 * Convert HH:MM string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes since midnight to HH:MM string
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Check if two time ranges overlap
 * Overlap occurs when one range starts before the other ends
 */
export function doTimeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1)
  const e1 = timeToMinutes(end1)
  const s2 = timeToMinutes(start2)
  const e2 = timeToMinutes(end2)

  // Overlap if one starts before the other ends
  return s1 < e2 && s2 < e1
}

/**
 * Check if a block has valid time range (end > start)
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  return timeToMinutes(startTime) < timeToMinutes(endTime)
}

/**
 * Check if blocks within a plan overlap with each other
 */
export function findInternalConflicts(blocks: Block[]): Array<{ index1: number; index2: number }> {
  const conflicts: Array<{ index1: number; index2: number }> = []

  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      if (
        doTimeRangesOverlap(
          blocks[i].startTime,
          blocks[i].endTime,
          blocks[j].startTime,
          blocks[j].endTime
        )
      ) {
        conflicts.push({ index1: i, index2: j })
      }
    }
  }

  return conflicts
}

/**
 * Calculate available time slots given occupied slots and day boundaries
 */
export function calculateAvailableSlots(
  dayStart: string,
  dayEnd: string,
  occupiedSlots: TimeRange[],
  minDurationMinutes: number = 30
): AvailableSlot[] {
  const available: AvailableSlot[] = []

  const dayStartMins = timeToMinutes(dayStart)
  const dayEndMins = timeToMinutes(dayEnd)

  // Sort occupied slots by start time
  const sorted = [...occupiedSlots].sort((a, b) =>
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  )

  // Find gaps between day start and first occupied slot
  if (sorted.length === 0) {
    // No occupied slots, entire day is available
    const duration = dayEndMins - dayStartMins
    if (duration >= minDurationMinutes) {
      available.push({
        startTime: dayStart,
        endTime: dayEnd,
        duration,
      })
    }
    return available
  }

  // Check gap before first occupied slot
  const firstSlotStart = timeToMinutes(sorted[0].startTime)
  if (firstSlotStart > dayStartMins) {
    const duration = firstSlotStart - dayStartMins
    if (duration >= minDurationMinutes) {
      available.push({
        startTime: dayStart,
        endTime: sorted[0].startTime,
        duration,
      })
    }
  }

  // Check gaps between occupied slots
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = timeToMinutes(sorted[i].endTime)
    const nextStart = timeToMinutes(sorted[i + 1].startTime)

    if (nextStart > currentEnd) {
      const duration = nextStart - currentEnd
      if (duration >= minDurationMinutes) {
        available.push({
          startTime: sorted[i].endTime,
          endTime: sorted[i + 1].startTime,
          duration,
        })
      }
    }
  }

  // Check gap after last occupied slot
  const lastSlotEnd = timeToMinutes(sorted[sorted.length - 1].endTime)
  if (dayEndMins > lastSlotEnd) {
    const duration = dayEndMins - lastSlotEnd
    if (duration >= minDurationMinutes) {
      available.push({
        startTime: sorted[sorted.length - 1].endTime,
        endTime: dayEnd,
        duration,
      })
    }
  }

  return available
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}m`
}

/**
 * Suggest alternative time for a conflicting block
 */
export function suggestAlternativeTime(
  blockDuration: number,
  availableSlots: AvailableSlot[]
): AvailableSlot | null {
  // Find the first slot that can fit the block
  return availableSlots.find((slot) => slot.duration >= blockDuration) || null
}
