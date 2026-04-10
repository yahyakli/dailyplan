'use client'
import { useState, useEffect, useCallback } from 'react'
import { savePlanLocally, getGuestPlanCount } from '@/lib/storage'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import type { Plan, Badge, Block } from '@/lib/types'
import { useTranslations, useLanguage } from '@/lib/i18n/LanguageContext'
import { Star, AlertTriangle, Clock, Calendar, Info, Sparkles, Timer } from 'lucide-react'
import BadgeUnlockToast from './BadgeUnlockToast'
import TimeSlotVisualizer from './TimeSlotVisualizer'

interface OccupiedSlot {
  startTime: string
  endTime: string
  blockTitle: string
  blockCategory: string
}

interface ConflictInfo {
  blockTitle: string
  blockTime: string
  existingPlanDate: string
  existingBlockTitle: string
  existingTime: string
}

interface Props {
  onPlanReady: (plan: Plan) => void
  onLoading: (loading: boolean) => void
}

export default function BrainDump({ onPlanReady, onLoading }: Props) {
  const { data: session } = useSession()
  const { locale } = useLanguage()
  const today = new Date()
  const localTodayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0]

  const [tasks, setTasks] = useState('')
  const [date, setDate] = useState(localTodayStr)
  
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState('')

  // Initialize and reset times based on date
  useEffect(() => {
    if (date === localTodayStr) {
      const now = new Date()
      const currentMins = now.getHours() * 60 + now.getMinutes()
      // if past 8:30am, suggest now + 45min
      if (currentMins >= 8 * 60 + 30) {
        const suggested = new Date(now.getTime() + 45 * 60000)
        let h = suggested.getHours()
        let m = Math.ceil(suggested.getMinutes() / 30) * 30
        if (m >= 60) {
          h = (h + 1) % 24
          m = 0
        }
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
        setStartTime(timeStr)
        // Set end time to 3 hours later or 23:59
        const endH = Math.min(h + 3, 23)
        setEndTime(endH >= 23 ? '23:59' : `${endH.toString().padStart(2, '0')}:00`)
      } else {
        setStartTime('09:00')
        setEndTime('18:00')
      }
    } else {
      // For future dates, default to 9-6
      setStartTime('09:00')
      setEndTime('18:00')
    }
  }, [date, localTodayStr])

  // Ensure endTime is at least 30 mins after startTime when manual changes occur
  useEffect(() => {
    if (!startTime || !endTime) return
    const [sh, sm] = startTime.split(':').map(Number)
    const startMins = sh * 60 + sm
    const [eh, em] = endTime.split(':').map(Number)
    const endMins = eh * 60 + em
    
    if (endMins <= startMins) {
      const newEnd = Math.min(startMins + 60, 1439) // +1 hour or midnight
      const h = Math.floor(newEnd / 60)
      const m = newEnd % 60
      setEndTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    }
  }, [startTime])
  const [newBadges, setNewBadges] = useState<Badge[]>([])

  // Time slot conflict state
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([])
  const [showConflictWarning, setShowConflictWarning] = useState(false)
  const [proposedBlocks, setProposedBlocks] = useState<Block[]>([])

  const t = useTranslations()

  // Fetch occupied time slots when date changes
  const fetchOccupiedSlots = useCallback(async () => {
    if (!session?.user) {
      setOccupiedSlots([])
      return
    }

    setIsLoadingSlots(true)
    try {
      const res = await fetch(`/api/plan/slots?date=${date}&dayStart=${startTime}&dayEnd=${endTime}`)
      if (res.ok) {
        const data = await res.json()
        setOccupiedSlots(data.occupiedSlots || [])
      }
    } catch (err) {
      console.error('Failed to fetch time slots:', err)
    } finally {
      setIsLoadingSlots(false)
    }
  }, [date, startTime, endTime, session])

  useEffect(() => {
    fetchOccupiedSlots()
  }, [fetchOccupiedSlots])

  const handleSubmit = async () => {
    if (!tasks.trim()) {
      toast.error(t('braindump.errorNoTasks'))
      return
    }


    if (date === localTodayStr) {
      const now = new Date()
      const [h, m] = startTime.split(':').map(Number)
      
      const selectedTime = new Date()
      selectedTime.setHours(h, m, 0, 0)

      const nowTime = now.getTime()
      const schedTime = selectedTime.getTime()
      
      // If start time is in the past OR less than 30 mins from now
      if (schedTime < nowTime + (29 * 60000)) {
        toast.error(t('braindump.startTimeErrorToday'))
        return
      }
    }

    setError('')
    setLoading(true)
    onLoading(true)
    setShowConflictWarning(false)
    setConflicts([])

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tasks, 
          startTime, 
          endTime, 
          context, 
          date, 
          locale
        }),
      })

      const data = await res.json()

      // Handle conflict response (409)
      if (res.status === 409) {
        setConflicts(data.conflicts || [])
        setShowConflictWarning(true)
        setLoading(false)
        onLoading(false)

        // Show conflict toast with suggestion
        toast.error(
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{t('braindump.conflictDetected')}</div>
            <div style={{ fontSize: 13 }}>{data.suggestion || t('braindump.conflictNote')}</div>
          </div>,
          { duration: 8000 }
        )
        return
      }

      if (!res.ok) {
        const errorMsg = data.error || (t('common.error') || 'Failed to generate schedule')
        const lowerError = errorMsg.toLowerCase()

        if (lowerError.includes('401') || lowerError.includes('invalid') || lowerError.includes('unauthorized') || lowerError.includes('unavailable')) {
          toast.error(t('braindump.errorInvalidKey'))
        } else if (lowerError.includes('429') || lowerError.includes('too many requests') || lowerError.includes('rate limit') || lowerError.includes('capacity')) {
          toast.error(t('braindump.errorRateLimit'))
        } else if (lowerError.includes('moderation') || lowerError.includes('policy') || lowerError.includes('safety') || lowerError.includes('inappropriate')) {
          toast.error(t('braindump.errorModeration') || 'Content violates safety guidelines.')
        } else if (lowerError.includes('parse') || lowerError.includes('format') || lowerError.includes('syntax') || lowerError.includes('invalid schedule')) {
          toast.error(t('braindump.errorInvalidSchedule') || 'Could not create a schedule from these tasks.')
        } else {
          toast.error(errorMsg)
        }
        throw new Error(errorMsg)
      }

      const plan: Plan = {
        ...data,
        status: 'draft',
        blocks: data.blocks.map((b: any, i: number) => ({
          ...b,
          id: `block-${Date.now()}-${i}`,
          completed: false,
        })),
      }
      savePlanLocally(plan)

      toast.success(t('braindump.successToast'))
      onPlanReady(plan)

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (t('common.error') || 'Something went wrong')
      if (!message.includes('Invalid API key') && !message.includes('Too many requests') && !message.includes('Time conflict')) {
        setError(message)
      }
    } finally {
      setLoading(false)
      onLoading(false)
      
      // Implement a 10-second cooldown to prevent spamming the AI API
      setCooldown(10)
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  const guestCount = typeof window !== 'undefined' ? getGuestPlanCount() : 0
  const showUpsell = !session && guestCount >= 3

  const hasTimeOverlap = occupiedSlots.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Badge unlock toast */}
      {newBadges.length > 0 && (
        <BadgeUnlockToast
          badges={newBadges}
          onDismiss={() => setNewBadges([])}
        />
      )}

      {/* Guest upsell after 3 plans */}
      {showUpsell && (
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.3)',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)' }}><Star size={18} strokeWidth={2.5} /></span>
          <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>
            {t('braindump.upsell').replace('{count}', String(guestCount))}
          </span>
          <a href="/auth/signup" style={{
            padding: '6px 14px', borderRadius: 6,
            background: 'var(--accent)', color: '#fff',
            textDecoration: 'none', fontSize: 13, fontWeight: 600,
            fontFamily: 'Syne', whiteSpace: 'nowrap',
          }}>
            {t('braindump.signupFree')}
          </a>
        </div>
      )}

      {/* Tasks textarea */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {t('braindump.label')}
        </label>
        <textarea
          value={tasks}
          onChange={e => setTasks(e.target.value)}
          placeholder={t('braindump.placeholder')}
          rows={9}
          style={{
            width: '100%', padding: '14px 16px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text)', fontSize: 14,
            fontFamily: 'DM Sans', resize: 'vertical', lineHeight: 1.7,
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* Time pickers & Date */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'clamp(8px, 2vw, 12px)' }}>
          <DateInput
            label={t('history.today')}
            value={date}
            onChange={setDate}
            min={localTodayStr}
            max={new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0]}
          />
          <TimeInput label={t('braindump.startTime')} value={startTime} onChange={setStartTime} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'clamp(8px, 2vw, 12px)' }}>
          <TimeInput label={t('braindump.endTime')} value={endTime} onChange={setEndTime} />
          {/* Context */}
          <div>
            <label style={labelStyle}>{t('braindump.context')}</label>
            <input
              type="text"
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder={t('braindump.contextPlaceholder')}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>
        </div>
      </div>

      {/* Time Slot Visualizer - show when user is authenticated */}
      {session?.user && (
        <div style={{
          padding: 16,
          background: 'var(--surface)',
          borderRadius: 12,
          border: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}>
            <Calendar size={16} color="var(--muted)" />
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--muted)',
              fontFamily: 'Syne',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {t('braindump.overview')}
            </span>
            {isLoadingSlots && (
              <span style={{
                fontSize: 11,
                color: 'var(--accent)',
                marginLeft: 'auto',
              }}>
                {t('common.loading')}
              </span>
            )}
          </div>

          <TimeSlotVisualizer
            date={date}
            dayStart={startTime}
            dayEnd={endTime}
            occupiedSlots={occupiedSlots}
            conflicts={conflicts}
            showAvailableGaps={true}
          />

          {hasTimeOverlap && (
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              background: 'rgba(124, 106, 247, 0.1)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}>
              <Info size={14} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text)' }}>
                {t('braindump.occupiedNotice').replace('{count}', String(occupiedSlots.length))}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Conflict Warning */}
      {showConflictWarning && conflicts.length > 0 && (
        <div style={{
          padding: '14px 16px',
          background: 'rgba(247, 92, 106, 0.1)',
          border: '1px solid rgba(247, 92, 106, 0.4)',
          borderRadius: 10,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
          }}>
            <AlertTriangle size={18} color="#f75c6a" />
            <span style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#f75c6a',
              fontFamily: 'Syne',
            }}>
              {t('braindump.conflictDetected')}
            </span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginBottom: 12,
          }}>
            {conflicts.map((conflict, idx) => (
              <div key={idx} style={{
                fontSize: 12,
                color: 'var(--text)',
                padding: '8px 12px',
                background: 'rgba(247, 92, 106, 0.05)',
                borderRadius: 6,
              }}>
                <span style={{ fontWeight: 600 }}>{conflict.blockTitle}</span>
                <span style={{ color: 'var(--muted)' }}> ({conflict.blockTime})</span>
                <span style={{ color: '#f75c6a' }}> {locale === 'ar' ? 'يتعارض مع' : locale === 'fr' ? 'en conflit avec' : 'conflicts with'} </span>
                <span style={{ fontWeight: 600 }}>{conflict.existingBlockTitle}</span>
                <span style={{ color: 'var(--muted)' }}> ({conflict.existingTime})</span>
              </div>
            ))}
          </div>

          <div style={{
            fontSize: 12,
            color: 'var(--muted)',
            marginBottom: 8,
          }}>
            {t('braindump.conflictNote')}
          </div>
        </div>
      )}

      {/* General Error */}
      {error && !showConflictWarning && (
        <div style={{ padding: '10px 14px', background: 'rgba(247,92,106,0.1)', border: '1px solid rgba(247,92,106,0.3)', borderRadius: 8, color: '#f75c6a', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Submit */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={handleSubmit}
          disabled={loading || showConflictWarning || cooldown > 0}
          style={{
            width: '100%',
            padding: '14px',
            background: loading || showConflictWarning || cooldown > 0 ? 'var(--border)' : 'linear-gradient(135deg, var(--accent), #9b8af7)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            cursor: loading || showConflictWarning || cooldown > 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'Syne',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            opacity: loading || showConflictWarning || cooldown > 0 ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              {t('braindump.generating') || 'Generating...'}
            </>
          ) : cooldown > 0 ? (
            <>
              <Timer size={18} />
              {t('braindump.cooldown') || 'COOLDOWN'} ({cooldown}s)
            </>
          ) : (
            <>
              <Sparkles size={18} />
              {showConflictWarning ? t('braindump.resolveConflicts') || 'Resolve Conflicts to Continue' : t('braindump.generate')}
            </>
          )}
        </button>
        {cooldown > 0 && (
          <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
            {t('braindump.cooldownNote') || 'To prevent rate limits, please wait a few seconds before generating again.'}
          </p>
        )}
      </div>
    </div>
  )
}

function DateInput({ label, value, onChange, min, max }: { label: string; value: string; onChange: (v: string) => void, min: string, max: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, cursor: 'pointer', paddingRight: 4 }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      />
    </div>
  )
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ minWidth: 0 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, cursor: 'pointer', paddingRight: 4 }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      />
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--muted)', marginBottom: 6,
  fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.06em',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: 'clamp(10px, 2.5vw, 12px) 14px',
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text)', fontSize: 'clamp(13px, 3vw, 14px)',
  fontFamily: 'DM Sans', outline: 'none',
  transition: 'border-color 0.15s',
  colorScheme: 'dark',
  minHeight: 'clamp(44px, 10vw, 48px)',
}
