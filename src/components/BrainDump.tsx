'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { savePlanLocally, getGuestPlanCount } from '@/lib/storage'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import type { Plan, Badge } from '@/lib/types'
import { useTranslations, useLocale } from 'next-intl'
import { Star, AlertTriangle, Calendar, Info, Sparkles, Timer, ArrowRight } from 'lucide-react'
import BadgeUnlockToast from './BadgeUnlockToast'
import TimeSlotVisualizer from './TimeSlotVisualizer'
import { timeToMinutes, type AvailableSlot, type ConflictInfo } from '@/lib/timeValidation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/navigation'

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

const CONTEXT_TAGS = [
  { id: 'low_energy', icon: '🍃' },
  { id: 'high_energy', icon: '⚡' },
  { id: 'deep_work', icon: '🧠' },
  { id: 'meetings', icon: '🤝' },
  { id: 'creative', icon: '🎨' },
  { id: 'exercise', icon: '💪' },
  { id: 'admin', icon: '📁' },
]

export default function BrainDump({ onPlanReady, onLoading }: Props) {
  const { data: session } = useSession()
  const locale = useLocale()
  const t = useTranslations()
  const today = new Date()
  const localTodayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0]

  const [tasks, setTasks] = useState('')
  const [date, setDate] = useState(localTodayStr)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('17:00')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [tasks])

  // LocalStorage persistence (debounced)
  useEffect(() => {
    const saved = localStorage.getItem('dailyplan:draft:tasks')
    if (saved) setTasks(saved)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('dailyplan:draft:tasks', tasks)
    }, 1000)
    return () => clearTimeout(timer)
  }, [tasks])

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
        // Set end time to 8 hours later or 23:59
        const endH = Math.min(h + 8, 23)
        setEndTime(endH >= 23 ? '23:59' : `${endH.toString().padStart(2, '0')}:00`)
      } else {
        setStartTime('08:00')
        setEndTime('17:00')
      }
    } else {
      setStartTime('08:00')
      setEndTime('17:00')
    }
  }, [date, localTodayStr])

  // Time validation
  useEffect(() => {
    if (!startTime || !endTime) return
    const startMins = timeToMinutes(startTime)
    const endMins = timeToMinutes(endTime)
    
    if (endMins <= startMins) {
      const newEnd = Math.min(startMins + 60, 1439)
      const h = Math.floor(newEnd / 60)
      const m = newEnd % 60
      setEndTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    }
  }, [startTime])

  const [newBadges, setNewBadges] = useState<Badge[]>([])
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([])
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [showConflictWarning, setShowConflictWarning] = useState(false)

  // Fetch occupied time slots
  const fetchOccupiedSlots = useCallback(async () => {
    setIsLoadingSlots(true)
    try {
      if (session?.user) {
        const res = await fetch(`/api/plan/slots?date=${date}`)
        if (res.ok) {
          const data = await res.json()
          setOccupiedSlots(data.occupiedSlots || [])
          setIsLoadingSlots(false)
          return
        }
      }

      // Guest fallback
      const localPlans = Object.keys(localStorage)
        .filter(k => k.startsWith(`dailyplan:plan:${date}`))
        .map(k => JSON.parse(localStorage.getItem(k) || '{}'))
        .filter(p => !p.isArchived)
      
      const slots: OccupiedSlot[] = []
      localPlans.forEach(p => {
        p.blocks?.forEach((b: any) => {
          slots.push({
            startTime: b.startTime,
            endTime: b.endTime,
            blockTitle: b.title,
            blockCategory: b.category
          })
        })
      })
      setOccupiedSlots(slots)
    } catch (err) {
      console.error('Failed to fetch time slots:', err)
    } finally {
      setIsLoadingSlots(false)
    }
  }, [date, session])

  useEffect(() => {
    fetchOccupiedSlots()
  }, [fetchOccupiedSlots])

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  const handleSubmit = async (resolution?: 'replace') => {
    if (tasks.trim().length < 3) {
      toast.error(t('braindump.errorNoTasks'))
      return
    }

    if (selectedTags.length === 0) {
      toast.error(t('braindump.errorNoTags') || 'Please select at least one context tag.')
      return
    }

    setLoading(true)
    onLoading(true)
    setShowConflictWarning(false)
    setConflicts([])
    setAvailableSlots([])

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tasks, 
          startTime, 
          endTime, 
          context: selectedTags.join(','), 
          date, 
          locale,
          resolution
        }),
      })

      const data = await res.json()

      if (res.status === 409) {
        setConflicts(data.conflicts || [])
        setAvailableSlots(data.availableSlots || [])
        setShowConflictWarning(true)
        setLoading(false)
        onLoading(false)
        toast.error(t('braindump.conflictDetected'))
        return
      }

      if (!res.ok) {
        throw new Error(data.error || t('common.error'))
      }

      const plan: Plan = {
        ...data,
        status: 'draft',
        tasks: data.tasks.map((b: any, i: number) => ({
          ...b,
          id: `block-${Date.now()}-${i}`,
          status: 'todo',
          xpValue: b.xpValue || 10,
          order: i,
        })),
      }

      savePlanLocally(plan)
      if (data.newBadges) setNewBadges(data.newBadges)
      
      toast.success(t('braindump.successToast'))
      onPlanReady(plan)

    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
      onLoading(false)
    }
  }

  const guestCount = typeof window !== 'undefined' ? getGuestPlanCount() : 0
  const showUpsell = !session && guestCount >= 3

  return (
    <div className="flex flex-col gap-6 fade-up">
      {/* Badge unlock toast */}
      {newBadges.length > 0 && (
        <BadgeUnlockToast
          badges={newBadges}
          onDismiss={() => setNewBadges([])}
        />
      )}

      {/* Guest upsell */}
      {showUpsell && (
        <Card className="bg-primary/10 border-primary/20 p-4 flex items-center gap-4">
          <Star className="text-primary shrink-0" size={20} />
          <p className="text-sm flex-1">
            {t('braindump.upsell').replace('{count}', String(guestCount))}
          </p>
          <Button asChild size="sm">
            <Link href="/auth/signup">{t('braindump.signupFree')}</Link>
          </Button>
        </Card>
      )}

      {/* Braindump Textarea */}
      <div className="space-y-3">
        <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {t('braindump.label')}
        </Label>
        <textarea
          ref={textareaRef}
          value={tasks}
          onChange={e => setTasks(e.target.value)}
          placeholder={t('braindump.placeholder')}
          className="w-full min-h-[140px] p-4 bg-muted/50 border border-border rounded-xl text-foreground text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none leading-relaxed"
        />
      </div>

      {/* Date & Time Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {t('history.today')}
          </Label>
          <Input
            type="date"
            value={date}
            min={localTodayStr}
            onChange={e => setDate(e.target.value)}
            className="bg-muted/50"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {t('braindump.startTime')}
          </Label>
          <Input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="bg-muted/50"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {t('braindump.endTime')}
          </Label>
          <Input
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            className="bg-muted/50"
          />
        </div>
      </div>

      {/* Context Tags */}
      <div className="space-y-3">
        <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {t('braindump.context')}
        </Label>
        <div className="flex flex-wrap gap-2">
          {CONTEXT_TAGS.map(tag => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                selectedTags.includes(tag.id)
                  ? "bg-primary border-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              <span>{tag.icon}</span>
              {t(`braindump.context_${tag.id}`) || tag.id.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Overview */}
      <Card className="bg-muted/30 border-dashed p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-muted-foreground" size={14} />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {t('braindump.overview')}
          </span>
          {isLoadingSlots && <Timer className="animate-spin text-primary ml-auto" size={12} />}
        </div>
        
        <TimeSlotVisualizer
          date={date}
          dayStart={startTime}
          dayEnd={endTime}
          occupiedSlots={occupiedSlots}
          showAvailableGaps={true}
        />

        {occupiedSlots.length > 0 && (
          <div className="mt-4 flex items-start gap-2 text-[11px] text-muted-foreground bg-primary/5 p-2 rounded-lg border border-primary/10">
            <Info size={14} className="text-primary shrink-0" />
            <p>{t('braindump.occupiedNotice').replace('{count}', String(occupiedSlots.length))}</p>
          </div>
        )}
      </Card>

      {/* Conflict Warning */}
      {showConflictWarning && conflicts.length > 0 && (
        <Card className="bg-destructive/10 border-destructive/20 p-4 space-y-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={18} />
            <span className="text-sm font-bold font-heading">{t('braindump.conflictDetected')}</span>
          </div>

          <div className="space-y-2">
            {conflicts.map((conflict, idx) => (
              <div key={idx} className="text-xs bg-destructive/5 p-2 rounded-lg border border-destructive/10">
                <span className="font-bold text-foreground">{conflict.blockTitle}</span>
                <span className="text-muted-foreground"> ({conflict.blockTime})</span>
                <span className="text-destructive mx-1">
                  {locale === 'ar' ? 'يتعارض مع' : locale === 'fr' ? 'en conflit avec' : 'conflicts with'}
                </span>
                <span className="font-bold text-foreground">{conflict.existingBlockTitle}</span>
                <span className="text-muted-foreground"> ({conflict.existingTime})</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground italic">
            {t('braindump.conflictNote')}
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full justify-start text-xs h-9"
              onClick={() => handleSubmit('replace')}
              disabled={loading}
            >
              <AlertTriangle size={14} className="mr-2" />
              {t('braindump.replaceExisting')}
            </Button>

            {availableSlots.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('braindump.adjustToGap')}
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {availableSlots.slice(0, 3).map((slot, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="justify-between text-[11px] h-9 border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                      onClick={() => {
                        setStartTime(slot.startTime)
                        setEndTime(slot.endTime)
                        setShowConflictWarning(false)
                        setConflicts([])
                      }}
                    >
                      <span className="flex items-center">
                        <Calendar size={12} className="mr-2 text-primary" />
                        {slot.startTime} — {slot.endTime}
                      </span>
                      <span className="flex items-center text-primary font-bold">
                        {slot.duration}m <ArrowRight size={12} className="ml-1" />
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Submit Button */}
      <Button 
        size="lg" 
        className="w-full h-14 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
        onClick={handleSubmit}
        disabled={loading || tasks.length < 3 || selectedTags.length === 0}
      >
        {loading ? (
          <><Timer className="animate-spin mr-2" size={20} /> {t('braindump.generating')}</>
        ) : (
          <><Sparkles className="mr-2" size={20} /> {showConflictWarning ? t('braindump.resolveConflicts') : t('braindump.generate')}</>
        )}
      </Button>
    </div>
  )
}
