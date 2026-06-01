'use client'

import { useState } from 'react'
import type { Block } from '@/lib/types'
import { formatDuration, timeToMinutes, minutesToTime } from '@/lib/timeValidation'
import { cn } from '@/lib/utils'

interface OccupiedSlot {
  startTime: string
  endTime: string
  blockTitle: string
  blockCategory: string
  planId?: string
  duration?: number
}

interface AvailableSlot {
  startTime: string
  endTime: string
  duration: number
}

interface TimeSlotVisualizerProps {
  date: string
  dayStart: string
  dayEnd: string
  occupiedSlots: OccupiedSlot[]
  proposedSlots?: Block[]
  conflicts?: Array<{
    blockTitle: string
    blockTime: string
    existingBlockTitle: string
    existingTime: string
  }>
  showAvailableGaps?: boolean
  interactive?: boolean
  onSlotClick?: (slot: OccupiedSlot) => void
  onAvailableSlotClick?: (slot: AvailableSlot) => void
}

interface TimeSlotPosition {
  left: number
  width: number
  startTime: string
  endTime: string
  label: string
  category: string
  isConflict?: boolean
}

export default function TimeSlotVisualizer({
  date,
  dayStart,
  dayEnd,
  occupiedSlots,
  proposedSlots = [],
  conflicts = [],
  showAvailableGaps = true,
  interactive = false,
  onSlotClick,
  onAvailableSlotClick,
}: TimeSlotVisualizerProps) {
  const [hoveredSlot, setHoveredSlot] = useState<TimeSlotPosition | null>(null)

  const dayStartMinutes = timeToMinutes(dayStart)
  const dayEndMinutes = timeToMinutes(dayEnd)
  const totalDayMinutes = dayEndMinutes - dayStartMinutes

  // Calculate positions for occupied slots
  const occupiedPositions: TimeSlotPosition[] = occupiedSlots.map((slot) => {
    const slotStart = timeToMinutes(slot.startTime)
    const slotEnd = timeToMinutes(slot.endTime)
    const left = ((slotStart - dayStartMinutes) / totalDayMinutes) * 100
    const width = ((slotEnd - slotStart) / totalDayMinutes) * 100

    return {
      left,
      width,
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: slot.blockTitle,
      category: slot.blockCategory,
      isConflict: false,
    }
  })

  // Calculate positions for proposed slots (from new plan being created)
  const proposedPositions: TimeSlotPosition[] = proposedSlots.map((slot) => {
    const slotStart = timeToMinutes(slot.startTime)
    const slotEnd = timeToMinutes(slot.endTime)
    const left = ((slotStart - dayStartMinutes) / totalDayMinutes) * 100
    const width = ((slotEnd - slotStart) / totalDayMinutes) * 100

    // Check if this slot has conflicts
    const hasConflict = conflicts.some(
      (c) =>
        c.blockTitle === slot.title &&
        c.blockTime === `${slot.startTime}-${slot.endTime}`
    )

    return {
      left,
      width,
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: slot.title,
      category: slot.category,
      isConflict: hasConflict,
    }
  })

  // Calculate available gaps
  const availableGaps: TimeSlotPosition[] = []
  if (showAvailableGaps) {
    const allSlots = [
      ...occupiedPositions.map((p) => ({
        start: timeToMinutes(p.startTime),
        end: timeToMinutes(p.endTime),
      })),
      ...proposedPositions
        .filter((p) => !p.isConflict)
        .map((p) => ({
          start: timeToMinutes(p.startTime),
          end: timeToMinutes(p.endTime),
        })),
    ].sort((a, b) => a.start - b.start)

    let currentEnd = dayStartMinutes
    for (const slot of allSlots) {
      if (slot.start > currentEnd) {
        const gapDuration = slot.start - currentEnd
        if (gapDuration >= 15) {
          // Only show gaps of 15+ minutes
          const left = ((currentEnd - dayStartMinutes) / totalDayMinutes) * 100
          const width = (gapDuration / totalDayMinutes) * 100
          availableGaps.push({
            left,
            width,
            startTime: minutesToTime(currentEnd),
            endTime: minutesToTime(slot.start),
            label: `${formatDuration(gapDuration)} free`,
            category: 'available',
            isConflict: false,
          })
        }
      }
      currentEnd = Math.max(currentEnd, slot.end)
    }

    // Check for gap at end of day
    if (dayEndMinutes > currentEnd) {
      const gapDuration = dayEndMinutes - currentEnd
      if (gapDuration >= 15) {
        const left = ((currentEnd - dayStartMinutes) / totalDayMinutes) * 100
        const width = (gapDuration / totalDayMinutes) * 100
        availableGaps.push({
          left,
          width,
          startTime: minutesToTime(currentEnd),
          endTime: dayEnd,
          label: `${formatDuration(gapDuration)} free`,
          category: 'available',
          isConflict: false,
        })
      }
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'deep-work':
        return 'hsl(var(--primary))'
      case 'communication':
        return 'hsl(var(--accent))'
      case 'admin':
        return 'hsl(var(--muted-foreground))'
      case 'personal':
        return 'hsl(var(--warning))'
      case 'break':
        return 'hsl(var(--success))'
      case 'available':
        return 'transparent'
      default:
        return 'hsl(var(--muted-foreground))'
    }
  }

  // Generate hour markers
  const hourMarkers: number[] = []
  for (let h = 0; h <= 24; h++) {
    const minutes = h * 60
    if (minutes >= dayStartMinutes && minutes <= dayEndMinutes) {
      hourMarkers.push(minutes)
    }
  }

  return (
    <div className="w-full py-2">
      {/* Header with date */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-[11px] font-bold font-heading text-foreground uppercase tracking-wider">
          {date}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
          {dayStart} — {dayEnd}
        </span>
      </div>

      {/* Timeline container */}
      <div className="relative h-12 bg-muted/30 rounded-xl border border-border/50 overflow-hidden shadow-inner">
        {/* Hour markers */}
        {hourMarkers.map((minutes) => {
          const left = ((minutes - dayStartMinutes) / totalDayMinutes) * 100
          const isMainHour = minutes % 60 === 0
          return (
            <div
              key={minutes}
              className={cn(
                "absolute top-0 bottom-0 border-l transition-opacity",
                isMainHour ? "border-border/30 opacity-100" : "border-border/10 opacity-50"
              )}
              style={{ left: `${left}%` }}
            />
          )
        })}

        {/* Available gaps */}
        {showAvailableGaps &&
          availableGaps.map((gap, index) => (
            <div
              key={`gap-${index}`}
              className={cn(
                "absolute top-1 bottom-1 bg-primary/5 border border-dashed border-primary/20 rounded-lg transition-all",
                interactive ? "cursor-pointer hover:bg-primary/10 hover:border-primary/40" : "cursor-default"
              )}
              style={{
                left: `${gap.left}%`,
                width: `${gap.width}%`,
              }}
              onClick={() =>
                onAvailableSlotClick?.({
                  startTime: gap.startTime,
                  endTime: gap.endTime,
                  duration: timeToMinutes(gap.endTime) - timeToMinutes(gap.startTime),
                })
              }
              onMouseEnter={() => setHoveredSlot(gap)}
              onMouseLeave={() => setHoveredSlot(null)}
            >
              {gap.width > 12 && (
                <div className="h-full flex items-center justify-center">
                  <span className="text-[8px] font-bold text-primary/60 whitespace-nowrap px-1">
                    {formatDuration(timeToMinutes(gap.endTime) - timeToMinutes(gap.startTime))}
                  </span>
                </div>
              )}
            </div>
          ))}

        {/* Occupied slots */}
        {occupiedPositions.map((slot, index) => (
          <div
            key={`occupied-${index}`}
            className={cn(
              "absolute top-1 bottom-1 rounded-lg shadow-sm transition-all",
              interactive ? "cursor-pointer hover:brightness-110" : "cursor-default"
            )}
            style={{
              left: `${slot.left}%`,
              width: `${slot.width}%`,
              backgroundColor: getCategoryColor(slot.category),
              minWidth: '4px',
            }}
            onClick={() =>
              onSlotClick?.({
                startTime: slot.startTime,
                endTime: slot.endTime,
                blockTitle: slot.label,
                blockCategory: slot.category,
              })
            }
            onMouseEnter={() => setHoveredSlot(slot)}
            onMouseLeave={() => setHoveredSlot(null)}
          >
            {slot.width > 15 && (
              <div className="h-full flex items-center px-1.5 overflow-hidden">
                <span className="text-[9px] font-bold text-white truncate drop-shadow-sm">
                  {slot.label}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Proposed slots (with conflict highlighting) */}
        {proposedPositions.map((slot, index) => (
          <div
            key={`proposed-${index}`}
            className={cn(
              "absolute rounded-lg transition-all z-10",
              slot.isConflict
                ? "top-0.5 bottom-0.5 bg-destructive/20 border-2 border-destructive animate-pulse"
                : "top-1 bottom-1 bg-primary/20 border border-primary shadow-lg shadow-primary/10"
            )}
            style={{
              left: `${slot.left}%`,
              width: `${slot.width}%`,
              minWidth: '4px',
            }}
            onMouseEnter={() => setHoveredSlot(slot)}
            onMouseLeave={() => setHoveredSlot(null)}
          >
            {slot.width > 12 && (
              <div className="h-full flex items-center px-1.5 overflow-hidden">
                <span className={cn(
                  "text-[9px] font-bold truncate",
                  slot.isConflict ? "text-destructive" : "text-primary"
                )}>
                  {slot.isConflict ? '⚠️ ' : '✨ '}
                  {slot.label}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Hover tooltip */}
        {hoveredSlot && (
          <div
            className="absolute -top-10 bg-popover border border-border rounded-lg px-2.5 py-1.5 shadow-xl z-50 pointer-events-none"
            style={{
              left: `${hoveredSlot.left + hoveredSlot.width / 2}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="text-[11px] font-bold text-popover-foreground">{hoveredSlot.label}</div>
            <div className="text-[9px] font-medium text-muted-foreground tabular-nums">
              {hoveredSlot.startTime} — {hoveredSlot.endTime}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
        {occupiedSlots.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-primary rounded-full" />
            <span className="text-[10px] font-semibold text-muted-foreground">
              Scheduled ({occupiedSlots.length})
            </span>
          </div>
        )}

        {proposedSlots.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-primary/30 border border-primary rounded-full" />
            <span className="text-[10px] font-semibold text-primary">
              Proposed ({proposedSlots.length})
            </span>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-destructive/30 border border-destructive rounded-full" />
            <span className="text-[10px] font-bold text-destructive">
              Conflicts ({conflicts.length})
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
