'use client'

import { useEffect, useState } from 'react'
import type { Block } from '@/lib/types'
import { formatDuration, timeToMinutes, minutesToTime } from '@/lib/timeValidation'

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
        return 'var(--accent)'
      case 'communication':
        return '#0fa8d8'
      case 'admin':
        return '#8888a0'
      case 'personal':
        return 'var(--accent-2)'
      case 'break':
        return '#f7be46'
      case 'available':
        return 'transparent'
      default:
        return 'var(--muted)'
    }
  }

  const formatTimeLabel = (time: string) => {
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }

  // Generate hour markers
  const hourMarkers: number[] = []
  for (let h = Math.ceil(dayStartMinutes / 60); h <= Math.floor(dayEndMinutes / 60); h++) {
    const minutes = h * 60
    if (minutes >= dayStartMinutes && minutes <= dayEndMinutes) {
      hourMarkers.push(minutes)
    }
  }

  return (
    <div
      style={{
        width: '100%',
        padding: '16px 0',
      }}
    >
      {/* Header with date */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text)',
            fontFamily: 'Syne',
          }}
        >
          {date}
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'var(--muted)',
          }}
        >
          {dayStart} - {dayEnd}
        </span>
      </div>

      {/* Timeline container */}
      <div
        style={{
          position: 'relative',
          height: 48,
          background: 'var(--surface)',
          borderRadius: 8,
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {/* Hour markers */}
        {hourMarkers.map((minutes) => {
          const left = ((minutes - dayStartMinutes) / totalDayMinutes) * 100
          return (
            <div
              key={minutes}
              style={{
                position: 'absolute',
                left: `${left}%`,
                top: 0,
                bottom: 0,
                width: 1,
                background: 'var(--border)',
                opacity: 0.5,
              }}
            />
          )
        })}

        {/* Available gaps */}
        {showAvailableGaps &&
          availableGaps.map((gap, index) => (
            <div
              key={`gap-${index}`}
              style={{
                position: 'absolute',
                left: `${gap.left}%`,
                width: `${gap.width}%`,
                top: 4,
                bottom: 4,
                background: 'rgba(124, 106, 247, 0.1)',
                borderRadius: 4,
                border: '1px dashed var(--accent)',
                cursor: interactive ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
              {gap.width > 10 && (
                <span
                  style={{
                    fontSize: 9,
                    color: 'var(--accent)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDuration(
                    timeToMinutes(gap.endTime) - timeToMinutes(gap.startTime)
                  )}
                </span>
              )}
            </div>
          ))}

        {/* Occupied slots */}
        {occupiedPositions.map((slot, index) => (
          <div
            key={`occupied-${index}`}
            style={{
              position: 'absolute',
              left: `${slot.left}%`,
              width: `${slot.width}%`,
              top: 4,
              bottom: 4,
              background: getCategoryColor(slot.category),
              borderRadius: 4,
              opacity: 0.7,
              cursor: interactive ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 4,
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
              <span
                style={{
                  fontSize: 9,
                  color: '#fff',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  padding: '0 4px',
                }}
              >
                {slot.label}
              </span>
            )}
          </div>
        ))}

        {/* Proposed slots (with conflict highlighting) */}
        {proposedPositions.map((slot, index) => (
          <div
            key={`proposed-${index}`}
            style={{
              position: 'absolute',
              left: `${slot.left}%`,
              width: `${slot.width}%`,
              top: slot.isConflict ? 2 : 4,
              bottom: slot.isConflict ? 2 : 4,
              background: slot.isConflict
                ? 'rgba(247, 92, 106, 0.3)'
                : 'rgba(124, 106, 247, 0.2)',
              borderRadius: 4,
              border: slot.isConflict
                ? '2px solid #f75c6a'
                : '1px solid var(--accent)',
              cursor: 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 4,
              zIndex: slot.isConflict ? 10 : 5,
            }}
            onMouseEnter={() => setHoveredSlot(slot)}
            onMouseLeave={() => setHoveredSlot(null)}
          >
            {slot.width > 10 && (
              <span
                style={{
                  fontSize: 9,
                  color: slot.isConflict ? '#f75c6a' : 'var(--accent)',
                  fontWeight: slot.isConflict ? 600 : 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  padding: '0 4px',
                }}
              >
                {slot.isConflict ? '⚠️ ' : ''}
                {slot.label}
              </span>
            )}
          </div>
        ))}

        {/* Hover tooltip */}
        {hoveredSlot && (
          <div
            style={{
              position: 'absolute',
              top: -40,
              left: `${hoveredSlot.left + hoveredSlot.width / 2}%`,
              transform: 'translateX(-50%)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 11,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              zIndex: 100,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ fontWeight: 600 }}>{hoveredSlot.label}</div>
            <div style={{ color: 'var(--muted)' }}>
              {formatTimeLabel(hoveredSlot.startTime)} -{' '}
              {formatTimeLabel(hoveredSlot.endTime)}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 12,
          flexWrap: 'wrap',
        }}
      >
        {occupiedSlots.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                background: 'var(--accent)',
                borderRadius: 2,
                opacity: 0.7,
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              Occupied ({occupiedSlots.length})
            </span>
          </div>
        )}

        {proposedSlots.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                background: 'rgba(124, 106, 247, 0.2)',
                border: '1px solid var(--accent)',
                borderRadius: 2,
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              Proposed ({proposedSlots.length})
            </span>
          </div>
        )}

        {conflicts.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                background: 'rgba(247, 92, 106, 0.3)',
                border: '2px solid #f75c6a',
                borderRadius: 2,
              }}
            />
            <span style={{ fontSize: 11, color: '#f75c6a', fontWeight: 600 }}>
              Conflicts ({conflicts.length})
            </span>
          </div>
        )}

        {availableGaps.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                background: 'rgba(124, 106, 247, 0.1)',
                border: '1px dashed var(--accent)',
                borderRadius: 2,
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              Available ({availableGaps.length})
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
