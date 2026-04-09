/**
 * Server-only time slot functions
 *
 * These functions use Mongoose models and can only be used in server components
 * or API routes. Do not import this file in client components.
 */

import type { Block } from './types'
import type { TimeRange, AvailableSlot, ConflictInfo } from './timeValidation'
import { TimeSlot } from '@/models/TimeSlot'
import { connectDB } from './mongodb'
import {
  timeToMinutes,
  calculateAvailableSlots,
} from './timeValidation'

/**
 * Check if new blocks conflict with existing time slots in the database
 */
export async function checkTimeConflicts(
  userId: string,
  date: string,
  blocks: Block[],
  excludePlanId?: string
): Promise<{ hasConflicts: boolean; conflicts: ConflictInfo[] }> {
  await connectDB()

  const conflicts: ConflictInfo[] = []

  // Get all existing time slots for this user on this date
  const query: { userId: string; date: string; planId?: { $ne: string } } = {
    userId,
    date,
  }

  // If updating an existing plan, exclude its own slots
  if (excludePlanId) {
    query.planId = { $ne: excludePlanId }
  }

  const existingSlots = await TimeSlot.find(query).lean()

  // Check each new block against existing slots
  for (const block of blocks) {
    for (const slot of existingSlots) {
      const s1 = timeToMinutes(block.startTime)
      const e1 = timeToMinutes(block.endTime)
      const s2 = timeToMinutes(slot.startTime)
      const e2 = timeToMinutes(slot.endTime)

      // Overlap if one starts before the other ends
      if (s1 < e2 && s2 < e1) {
        conflicts.push({
          blockTitle: block.title,
          blockTime: `${block.startTime}-${block.endTime}`,
          existingPlanDate: slot.date,
          existingBlockTitle: slot.blockTitle,
          existingTime: `${slot.startTime}-${slot.endTime}`,
        })
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  }
}

/**
 * Get all occupied time slots for a user on a specific date
 */
export async function getOccupiedTimeSlots(
  userId: string,
  date: string,
  excludePlanId?: string
): Promise<
  Array<{
    startTime: string
    endTime: string
    blockTitle: string
    blockCategory: string
    planId: string
  }>
> {
  await connectDB()

  const query: { userId: string; date: string; planId?: { $ne: string } } = {
    userId,
    date,
  }

  if (excludePlanId) {
    query.planId = { $ne: excludePlanId }
  }

  const slots = await TimeSlot.find(query)
    .sort({ startTime: 1 })
    .lean()

  return slots.map((slot) => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
    blockTitle: slot.blockTitle,
    blockCategory: slot.blockCategory,
    planId: slot.planId.toString(),
  }))
}

/**
 * Get available time slots for a user on a specific date
 */
export async function getAvailableTimeSlots(
  userId: string,
  date: string,
  dayStart: string,
  dayEnd: string,
  excludePlanId?: string,
  minDurationMinutes: number = 30
): Promise<AvailableSlot[]> {
  const occupied = await getOccupiedTimeSlots(userId, date, excludePlanId)
  return calculateAvailableSlots(dayStart, dayEnd, occupied, minDurationMinutes)
}

/**
 * Create time slot entries for a plan
 */
export async function createTimeSlots(
  userId: string,
  planId: string,
  date: string,
  blocks: Block[]
): Promise<void> {
  await connectDB()

  const slotDocs = blocks.map((block, index) => ({
    userId,
    date,
    startTime: block.startTime,
    endTime: block.endTime,
    planId,
    blockTitle: block.title,
    blockCategory: block.category,
    blockIndex: index,
  }))

  await TimeSlot.insertMany(slotDocs)
}

/**
 * Delete all time slots associated with a plan
 */
export async function deleteTimeSlotsForPlan(planId: string): Promise<void> {
  await connectDB()
  await TimeSlot.deleteMany({ planId })
}

/**
 * Update time slots for a plan (delete old, create new)
 */
export async function updateTimeSlots(
  userId: string,
  planId: string,
  date: string,
  blocks: Block[]
): Promise<void> {
  await connectDB()

  // Delete existing slots for this plan
  await TimeSlot.deleteMany({ planId })

  // Create new slots
  await createTimeSlots(userId, planId, date, blocks)
}
