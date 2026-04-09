'use client'

import { useState, useEffect, useRef } from 'react'
import type { Block } from '@/lib/types'
import {
  Target,
  MessageCircle,
  ClipboardList,
  Leaf,
  Coffee,
  Pin,
  Check,
  Play,
  RotateCcw,
  MoreHorizontal,
  SkipForward,
  Timer,
  Lock,
} from 'lucide-react'

export type BlockStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface BlockProgressInfo {
  status: BlockStatus
  completionPercentage: number
  startedAt?: Date
  completedAt?: Date
  canUndo?: boolean
  undoWindowRemaining?: number
  notes?: string
}

interface ScheduleBlockProps {
  block: Block
  index: number
  isActive?: boolean
  progress?: BlockProgressInfo
  onProgressUpdate?: (updates: Partial<BlockProgressInfo>) => void
  onComplete?: () => void
  onUndo?: () => void
  isGuest?: boolean
  isLocked?: boolean
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'deep-work': <Target size={18} strokeWidth={2} />,
  communication: <MessageCircle size={18} strokeWidth={2} />,
  admin: <ClipboardList size={18} strokeWidth={2} />,
  personal: <Leaf size={18} strokeWidth={2} />,
  break: <Coffee size={18} strokeWidth={2} />,
}

const CATEGORY_COLORS: Record<string, string> = {
  'deep-work': 'var(--accent)',
  communication: '#0fa8d8',
  admin: '#8888a0',
  personal: 'var(--accent-2)',
  break: '#f7be46',
}

export default function ScheduleBlock({
  block,
  index,
  isActive = false,
  progress,
  onProgressUpdate,
  onComplete,
  onUndo,
  isGuest = false,
  isLocked = false,
}: ScheduleBlockProps) {
  const icon = CATEGORY_ICONS[block.category] || <Pin size={18} strokeWidth={2} />
  const isBreak = block.category === 'break'

  const status = progress?.status || 'pending'
  const completionPercentage = progress?.completionPercentage || 0
  const isDone = status === 'completed'
  const isInProgress = status === 'in_progress'
  const isSkipped = status === 'skipped'
  const canUndo = (progress?.canUndo || (isGuest && isDone)) && isDone

  const [showOptions, setShowOptions] = useState(false)
  const [notesInput, setNotesInput] = useState(progress?.notes || '')
  const [localPercentage, setLocalPercentage] = useState(completionPercentage)
  const isDirty = useRef(false)

  // Sync local percentage with prop
  useEffect(() => {
    setLocalPercentage(completionPercentage)
  }, [completionPercentage])

  // Sync notes with prop if user hasn't edited them yet
  useEffect(() => {
    if (!isDirty.current && progress?.notes !== undefined && progress.notes !== notesInput) {
      setNotesInput(progress.notes || '')
    }
  }, [progress?.notes, notesInput])

  // Auto-save notes after debounce - only when plan is active and modified by user
  useEffect(() => {
    if (!isActive || !isDirty.current) return

    const currentNotes = progress?.notes || ''
    if (notesInput !== currentNotes) {
      const timeout = setTimeout(() => {
        onProgressUpdate?.({ notes: notesInput })
        isDirty.current = false // Reset dirty flag after saving
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [notesInput, progress?.notes, onProgressUpdate, isActive])

  const handleNotesChange = (val: string) => {
    setNotesInput(val)
    isDirty.current = true
  }

  const handleStartTask = () => {
    onProgressUpdate?.({
      status: 'in_progress',
      completionPercentage: 10,
    })
  }

  const handleProgressChange = (value: number) => {
    setLocalPercentage(value)
    let newStatus: BlockStatus = 'in_progress'
    if (value === 100) newStatus = 'completed'
    else if (value === 0) newStatus = 'pending'

    onProgressUpdate?.({
      status: newStatus,
      completionPercentage: value,
    })

    if (value === 100) {
      onComplete?.()
    }
  }

  const handleComplete = () => {
    onProgressUpdate?.({
      status: 'completed',
      completionPercentage: 100,
    })
    onComplete?.()
  }

  const handleUndo = () => {
    onUndo?.()
  }

  const handleSkip = () => {
    onProgressUpdate?.({
      status: 'skipped',
      completionPercentage: 0,
    })
  }

  const formatDuration = (start: string, end: string) => {
    const [h1, m1] = start.split(':').map(Number)
    const [h2, m2] = end.split(':').map(Number)
    const duration = (h2 - h1) * 60 + (m2 - m1)
    return `${duration}m`
  }

  // Get status-based styles
  const getStatusColor = () => {
    if (isSkipped) return 'var(--muted)'
    if (isDone) return 'var(--accent)'
    if (isInProgress) return CATEGORY_COLORS[block.category]
    return CATEGORY_COLORS[block.category]
  }

  const getBackgroundColor = () => {
    if (isSkipped) return 'rgba(128, 128, 128, 0.03)'
    if (isDone) return 'rgba(124, 106, 247, 0.05)'
    if (isInProgress) return `${CATEGORY_COLORS[block.category]}10`
    if (isBreak) return 'rgba(251, 191, 36, 0.04)'
    return 'var(--surface)'
  }

  // Render progress controls
  const renderProgressControls = () => {
    if (!isActive) return null

    // Special simplified UI for breaks: Just a binary "Done" toggle
    if (isBreak && !isDone) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
           <button
            onClick={handleComplete}
            disabled={isLocked}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              background: 'transparent',
              border: `2px solid ${isLocked ? 'var(--border)' : (CATEGORY_COLORS.break + '40')}`,
              borderRadius: 6,
              color: isLocked ? 'var(--muted)' : CATEGORY_COLORS.break,
              fontSize: 11,
              fontWeight: 600,
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.5 : 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isLocked) e.currentTarget.style.background = `${CATEGORY_COLORS.break}20`
            }}
            onMouseLeave={(e) => {
              if (!isLocked) e.currentTarget.style.background = 'transparent'
            }}
            title={isLocked ? 'Complete previous tasks first' : 'Mark as Done'}
          >
            <Check size={12} />
            Mark as Done
          </button>
        </div>
      )
    }

    // Completed state - show simple check
    if (isDone) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Check size={12} color="#fff" strokeWidth={4} />
          </div>
          {canUndo && (
            <button
              onClick={handleUndo}
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <RotateCcw size={10} />
              UNDO
            </button>
          )}
        </div>
      )
    }

    // Skipped state
    if (isSkipped) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'rgba(128, 128, 128, 0.1)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 11,
            color: 'var(--muted)',
            fontWeight: 500,
          }}
        >
          <SkipForward size={12} />
          Skipped
        </div>
      )
    }

    // In progress state - show compact bar and buttons (Not for breaks)
    if (isInProgress && !isBreak) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 140 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Horizontal progress visualization (non-interactive by default) */}
            <div
              style={{
                flex: 1,
                height: 6,
                background: 'var(--bg)',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${localPercentage}%`,
                  background: CATEGORY_COLORS[block.category],
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            
            <span style={{ fontSize: 11, fontWeight: 700, color: CATEGORY_COLORS[block.category], minWidth: 30 }}>
              {localPercentage}%
            </span>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleComplete}
                style={{
                  padding: '6px 12px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Check size={12} strokeWidth={3} />
                Done
              </button>

              <button
                onClick={() => setShowOptions(!showOptions)}
                style={{
                  padding: '6px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  color: showOptions ? 'var(--accent)' : 'var(--muted)',
                  cursor: 'pointer',
                }}
                title="Options"
              >
                <MoreHorizontal size={14} />
              </button>

              <button
                onClick={handleUndo}
                style={{
                  padding: '6px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  color: 'var(--muted)',
                  cursor: 'pointer',
                }}
                title="Undo start"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Collapsible advanced options (Slider & Notes) */}
          {showOptions && (
            <div 
              style={{ 
                padding: '12px', 
                background: 'var(--bg)', 
                borderRadius: 8, 
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                animation: 'slideDown 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Track Progress
                </span>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                  Drag or tap a preset
                </span>
              </div>

              {/* Quick-Set Percentage Buttons */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => handleProgressChange(pct)}
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      fontSize: 10,
                      fontWeight: 700,
                      background: localPercentage === pct ? CATEGORY_COLORS[block.category] : 'var(--surface)',
                      color: localPercentage === pct ? '#fff' : 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Timer size={12} color="var(--muted)" />
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Use presets to update progress
                </span>
              </div>

              <div style={{ height: 1, background: 'var(--border)', opacity: 0.5, margin: '2px 0' }} />
              
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Notes
              </span>
              <textarea
                value={notesInput}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="How's it going?"
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  color: 'var(--text)',
                  fontSize: 12,
                  resize: 'none',
                  outline: 'none',
                }}
              />
            </div>
          )}
        </div>
      )
    }

    // Pending state: If locked, hide controls to reduce noise
    if (isLocked) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', opacity: 0.5 }}>
          <Lock size={12} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.02em' }}>NEXT UP</span>
        </div>
      )
    }

    // Pending state - show start button
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleStartTask}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: CATEGORY_COLORS[block.category] + '15',
            border: 'none',
            borderRadius: 8,
            color: CATEGORY_COLORS[block.category],
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = CATEGORY_COLORS[block.category] + '25')}
          onMouseLeave={(e) => (e.currentTarget.style.background = CATEGORY_COLORS[block.category] + '15')}
        >
          <Play size={14} fill="currentColor" />
          START
        </button>

        <button
          onClick={handleSkip}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--muted)',
            cursor: 'pointer',
          }}
        >
          <SkipForward size={14} />
        </button>
      </div>
    )
  }

  // Regular block rendering
  return (
    <div
      className={`fade-up card-${block.category}`}
      style={{
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${getStatusColor()}`,
        borderRadius: 12,
        padding: '16px',
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        animationDelay: `${index * 0.05}s`,
        marginBottom: 12,
        background: getBackgroundColor(),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isSkipped ? 0.5 : 1,
        position: 'relative',
        boxShadow: isInProgress ? '0 4px 20px -8px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      <div style={{ paddingTop: 2, flexShrink: 0, opacity: isLocked ? 0.3 : 0.8 }}>{icon}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row with time and controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontFamily: 'Syne',
                fontWeight: 700,
                fontSize: 15,
                lineHeight: 1.3,
                textDecoration: isDone ? 'line-through' : 'none',
                color: isDone ? 'var(--muted)' : 'var(--text)',
                opacity: isLocked ? 0.6 : 1,
              }}
            >
              {block.title}
            </span>

            {/* Micro Metadata (Dots) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <div 
                style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  background: CATEGORY_COLORS[block.category] 
                }} 
              />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {block.category}
              </span>
            </div>
          </div>

          {/* Time badge */}
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', fontFamily: 'Syne', opacity: isLocked ? 0.4 : 1 }}>
              {block.startTime}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>
              {formatDuration(block.startTime, block.endTime)}
            </div>
          </div>
        </div>

        {/* Progress controls */}
        {isActive && (
          <div style={{ marginTop: 12 }}>{renderProgressControls()}</div>
        )}

        {progress?.notes && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--muted)',
              fontStyle: 'italic',
              marginTop: 10,
              paddingLeft: 10,
              borderLeft: '2px solid var(--border)',
            }}
          >
            “{progress.notes}”
          </p>
        )}

        {block.notes && !isInProgress && !isDone && !isLocked && (
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, lineHeight: 1.5, opacity: 0.8 }}>
            {block.notes}
          </p>
        )}
      </div>
    </div>
  )
}
