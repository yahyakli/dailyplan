'use client'
import type { Plan, Block } from '@/lib/types'
import ScheduleBlock, { BlockProgressInfo, BlockStatus } from './ScheduleBlock'
import OverflowList from './OverflowList'
import { useTranslations, useLanguage } from '@/lib/i18n/LanguageContext'
import { Lightbulb, ListTodo, Flame, Inbox, PlayCircle } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { savePlanLocally } from '@/lib/storage'
import { toast } from 'sonner'
import BadgeUnlockToast from './BadgeUnlockToast'
import type { Badge } from '@/lib/types'
import { useSession } from 'next-auth/react'

interface Props {
  plan: Plan
  onReset?: () => void
}

interface BlockProgressMap {
  [blockIndex: number]: BlockProgressInfo
}

export default function ScheduleView({ plan, onReset }: Props) {
  const t = useTranslations()
  const { locale } = useLanguage()
  const { data: session } = useSession()
  const [currentPlan, setCurrentPlan] = useState(plan)
  const [newBadges, setNewBadges] = useState<Badge[]>([])
  const [starting, setStarting] = useState(false)
  const [blockProgress, setBlockProgress] = useState<BlockProgressMap>(() => {
    // Build initial progress map from existing blocks (for Guest/Local persistence)
    const initial: BlockProgressMap = {}
    plan.blocks.forEach((b, i) => {
      // Prioritize explicit status/percentage fields for Guest restoration
      if (b.status || b.notes !== undefined || b.completed !== undefined) {
        initial[i] = {
          status: (b.status as BlockStatus) || (b.completed ? 'completed' : 'pending'),
          completionPercentage: b.progressPercentage ?? (b.completed ? 100 : 0),
          notes: b.notes || '',
          canUndo: false,
        }
      }
    })
    return initial
  })
  const blockProgressRef = useRef<BlockProgressMap>(blockProgress)
  useEffect(() => {
    blockProgressRef.current = blockProgress
  }, [blockProgress])

  const [isLoadingProgress, setIsLoadingProgress] = useState(false)

  useEffect(() => setCurrentPlan(plan), [plan])

  // Load block progress from API when plan becomes active
  const loadProgress = useCallback(async () => {
    if (currentPlan.status !== 'active' && currentPlan.status !== 'completed') return
    if (!session) return

    setIsLoadingProgress(true)
    try {
      const res = await fetch(`/api/plan/progress?planDate=${currentPlan.date}`)
      if (res.ok) {
        const data = await res.json()
        const newProgressMap: BlockProgressMap = {}
        let hasChanges = false
        const currentMap = blockProgressRef.current

        data.progress?.forEach((p: any) => {
          const newEntry: BlockProgressInfo = {
            status: p.status,
            completionPercentage: p.completionPercentage,
            startedAt: p.startedAt ? new Date(p.startedAt) : undefined,
            completedAt: p.completedAt ? new Date(p.completedAt) : undefined,
            canUndo: p.canUndo,
            undoWindowRemaining: p.undoWindowRemaining,
            notes: p.notes,
          }
          newProgressMap[p.blockIndex] = newEntry

          // Check for changes to avoid blinking re-renders
          const current = currentMap[p.blockIndex]
          if (!current || 
              current.status !== p.status || 
              current.completionPercentage !== p.completionPercentage ||
              current.notes !== p.notes ||
              current.canUndo !== p.canUndo) {
            hasChanges = true
          }
        })

        if (hasChanges || Object.keys(currentMap).length !== Object.keys(newProgressMap).length) {
          setBlockProgress(newProgressMap)
        }
      }
    } catch (err) {
      console.error('Failed to load progress:', err)
    } finally {
      setIsLoadingProgress(false)
    }
  }, [currentPlan.date, currentPlan.status, session])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  // Poll for undo window updates
  useEffect(() => {
    if (currentPlan.status !== 'active' && currentPlan.status !== 'completed') return

    const interval = setInterval(() => {
      loadProgress()
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [loadProgress, currentPlan.status])

  const copyAsText = () => {
    const lines = [
      `DailyPlan — ${currentPlan.date}`,
      '─'.repeat(40),
      ...currentPlan.blocks.map((b) => `${b.startTime}–${b.endTime}  ${b.title} [${b.category}]`),
      ...(currentPlan.overflow.length ? ['\nDid not fit:', ...currentPlan.overflow.map((t) => `  • ${t}`)] : []),
      `\n💡 ${currentPlan.insight}`,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
  }

  const handleStartPlan = async () => {
    setStarting(true)
    try {
      if (session) {
        const res = await fetch('/api/score/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: currentPlan }),
        })
        const data = await res.json()
        if (res.ok) {
          if (data.newBadges?.length > 0) setNewBadges(data.newBadges)
          if (data.pointsEarned) toast.success(`+${data.pointsEarned} Points ⚡`)
        }
      } else {
        toast.info('Guest Mode: Progress saved locally but won\'t sync across devices.')
      }
      const updatedPlan: Plan = { ...currentPlan, status: 'active' }
      setCurrentPlan(updatedPlan)
      savePlanLocally(updatedPlan)
      loadProgress() // Load initial progress state
    } catch (e) {
      console.error(e)
    } finally {
      setStarting(false)
    }
  }

  const handleProgressUpdate = async (
    blockIndex: number,
    updates: Partial<BlockProgressInfo>
  ) => {
    const block = currentPlan.blocks[blockIndex]

    // Optimistically update UI
    setBlockProgress((prev) => ({
      ...prev,
      [blockIndex]: {
        ...prev[blockIndex],
        ...updates,
      } as BlockProgressInfo,
    }))

    // Update local plan state blocks for persistence
    const updatedBlocks = [...currentPlan.blocks]
    const currentBlock = updatedBlocks[blockIndex]
    
    updatedBlocks[blockIndex] = {
      ...currentBlock,
      completed: updates.status === 'completed' ? true : updates.status === 'pending' ? false : currentBlock.completed,
      notes: updates.notes !== undefined ? updates.notes : currentBlock.notes,
      status: updates.status || currentBlock.status,
      progressPercentage: updates.completionPercentage !== undefined ? updates.completionPercentage : currentBlock.progressPercentage
    }

    const allCompleted = updatedBlocks.every((b) => b.completed)
    const updatedPlan: Plan = {
      ...currentPlan,
      blocks: updatedBlocks,
      status: allCompleted ? 'completed' : 'active',
    }
    
    setCurrentPlan(updatedPlan)
    savePlanLocally(updatedPlan)

    // Don't sync to API if plan is still a draft OR if no session (Guest)
    if (currentPlan.status === 'draft' || !session) return

    try {
      const res = await fetch('/api/plan/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planDate: currentPlan.date,
          blockIndex,
          status: updates.status || blockProgress[blockIndex]?.status,
          completionPercentage:
            updates.completionPercentage ?? blockProgress[blockIndex]?.completionPercentage,
          notes: updates.notes,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        // Update with server response (includes canUndo info)
        setBlockProgress((prev) => ({
          ...prev,
          [blockIndex]: {
            ...prev[blockIndex],
            status: data.status,
            completionPercentage: data.completionPercentage,
            startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
            completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
            canUndo: data.canUndo,
            undoWindowRemaining: data.undoWindowRemaining,
          },
        }))

        if (data.pointsEarned) {
          toast.success(`+${data.pointsEarned} Points ⚡`, {
            description: data.status === 'completed' ? 'Task completed!' : 'Task started!',
          })
        }
      } else {
        // Revert on error
        toast.error(data.error || 'Failed to update progress')
        loadProgress()
      }
    } catch (err) {
      console.error('Progress update failed:', err)
      loadProgress()
    }
  }

  const handleUndo = async (blockIndex: number) => {
    const currentInfo = blockProgress[blockIndex]
    const isUndoingInprogress = currentInfo?.status === 'in_progress'

    try {
      if (session) {
        const res = await fetch('/api/plan/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planDate: currentPlan.date,
            blockIndex,
            status: 'undo',
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to undo')
          loadProgress()
          return
        }
        toast.success(`Undo successful (-${data.pointsDeducted} Points)`)
      }

      // Update local state (shared for guests and users)
      const updatedBlocks = [...currentPlan.blocks]
      const newStatus = isUndoingInprogress ? 'pending' : 'in_progress'
      const newPercentage = isUndoingInprogress ? 0 : 50

      updatedBlocks[blockIndex] = {
        ...updatedBlocks[blockIndex],
        completed: false,
        status: newStatus,
        progressPercentage: newPercentage
      }
      const updatedPlan: Plan = {
        ...currentPlan,
        blocks: updatedBlocks,
        status: 'active',
      }
      setCurrentPlan(updatedPlan)
      savePlanLocally(updatedPlan)

      // Update progress map
      setBlockProgress((prev) => ({
        ...prev,
        [blockIndex]: {
          ...prev[blockIndex],
          status: newStatus as BlockStatus,
          completionPercentage: newPercentage,
          canUndo: false,
        },
      }))
    } catch (err) {
      console.error('Undo failed:', err)
      loadProgress()
    }
  }

  // Calculate plan progress stats
  const completedCount = Object.values(blockProgress).filter((p) => p.status === 'completed').length
  const inProgressCount = Object.values(blockProgress).filter((p) => p.status === 'in_progress').length
  const planCompletionPercentage = currentPlan.blocks.length
    ? Math.round((completedCount / currentPlan.blocks.length) * 100)
    : 0

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {newBadges.length > 0 && (
        <BadgeUnlockToast badges={newBadges} onDismiss={() => setNewBadges([])} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <p
            style={{
              fontSize: 11,
              color: 'var(--muted)',
              fontFamily: 'Syne',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: 4,
            }}
          >
            {t('schedule.yourSchedule')} {currentPlan.status === 'completed' && '— COMPLETED 🎉'}
          </p>
          <h2 style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            {new Date(currentPlan.date + 'T12:00:00').toLocaleDateString(
              locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : 'en-US',
              { weekday: 'long', month: 'long', day: 'numeric' }
            )}
          </h2>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copyAsText} style={{ ...actionBtnStyle, flex: 1 }}>
            {t('schedule.copyAsText')}
          </button>
          {onReset && (
            <button
              onClick={onReset}
              style={{
                ...actionBtnStyle,
                flex: 1,
                borderColor: 'var(--accent)',
                color: 'var(--accent)',
              }}
            >
              {t('schedule.newPlan')}
            </button>
          )}
        </div>
      </div>

      {/* Start button if draft */}
      {currentPlan.status === 'draft' && (
        <button
          onClick={handleStartPlan}
          disabled={starting}
          style={{
            ...actionBtnStyle,
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 16,
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(124,106,247,0.4)',
          }}
        >
          <PlayCircle size={20} />
          {starting ? 'Starting...' : 'Start Plan & Enable Progress'}
        </button>
      )}

      {/* Plan progress bar (when active/completed) */}
      {(currentPlan.status === 'active' || currentPlan.status === 'completed') && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--surface)',
            borderRadius: 10,
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
              Plan Progress
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {completedCount}/{currentPlan.blocks.length} completed ({planCompletionPercentage}%)
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: 'var(--border)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${planCompletionPercentage}%`,
                background: 'linear-gradient(90deg, var(--accent), #9b8af7)',
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {inProgressCount > 0 && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
              {inProgressCount} task{inProgressCount > 1 ? 's' : ''} in progress
            </div>
          )}
        </div>
      )}

      {/* AI Insight */}
      {currentPlan.insight && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            background: 'rgba(124,106,247,0.08)',
            border: '1px solid rgba(124,106,247,0.2)',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <span
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              color: 'var(--accent)',
              paddingTop: 2,
            }}
          >
            <Lightbulb size={18} />
          </span>
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, fontStyle: 'italic' }}>
            {currentPlan.insight}
          </p>
        </div>
      )}

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          {
            label: t('schedule.blocks'),
            value: currentPlan.blocks.length,
            emoji: <ListTodo size={22} strokeWidth={1.5} />,
          },
          {
            label: t('schedule.highPriority'),
            value: currentPlan.blocks.filter((b) => b.priority === 'high').length,
            emoji: <Flame size={22} strokeWidth={1.5} color="#f75c6a" />,
          },
          {
            label: t('schedule.overflow'),
            value: currentPlan.overflow.length,
            emoji: <Inbox size={22} strokeWidth={1.5} />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass"
            style={{
              padding: 'clamp(10px, 3vw, 14px) 8px',
              borderRadius: 10,
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, color: 'var(--muted)' }}>
              {stat.emoji}
            </div>
            <div style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 700, fontFamily: 'Syne', lineHeight: 1 }}>
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginTop: 3,
                lineHeight: 1.2,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {isLoadingProgress && (
          <div
            style={{
              textAlign: 'center',
              padding: '12px',
              fontSize: 12,
              color: 'var(--muted)',
            }}
          >
            Loading progress...
          </div>
        )}
        {currentPlan.blocks.map((block, i) => {
          const next = currentPlan.blocks[i + 1]
          const gapMin = next ? calcGapMinutes(block.endTime, next.startTime) : 0
          const prevBlockProgress = i > 0 ? blockProgress[i - 1] : null
          const isLocked = i > 0 && 
            prevBlockProgress?.status !== 'completed' && 
            prevBlockProgress?.status !== 'skipped'

          return (
            <div key={`${block.id || block.startTime}-${i}`}>
              <ScheduleBlock
                block={block}
                index={i}
                isActive={currentPlan.status === 'active' || currentPlan.status === 'completed'}
                isGuest={!session}
                isLocked={isLocked}
                progress={blockProgress[i]}
                onProgressUpdate={(updates) => handleProgressUpdate(i, updates)}
                onComplete={() =>
                  handleProgressUpdate(i, { status: 'completed', completionPercentage: 100 })
                }
                onUndo={() => handleUndo(i)}
              />
              {next && (
                <div 
                  style={{ 
                    marginLeft: 26, 
                    height: 12, 
                    width: 2, 
                    background: 'var(--border)', 
                    opacity: 0.5,
                    marginBottom: 12,
                  }} 
                />
              )}
              {gapMin > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '2px 12px',
                    margin: '0 0 4px 0',
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.4 }} />
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--muted)',
                      fontFamily: 'Syne',
                      fontWeight: 600,
                      letterSpacing: '0.07em',
                      whiteSpace: 'nowrap',
                      opacity: 0.6,
                    }}
                  >
                    · {gapMin} min ·
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.4 }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Overflow */}
      {currentPlan.overflow.length > 0 && <OverflowList tasks={currentPlan.overflow} />}
    </div>
  )
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function calcGapMinutes(endTime: string, nextStart: string): number {
  const gap = timeToMinutes(nextStart) - timeToMinutes(endTime)
  return gap > 0 ? gap : 0
}

const actionBtnStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: 'var(--muted)',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  transition: 'color 0.15s, border-color 0.15s',
}
