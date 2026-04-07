'use client'
import { useState } from 'react'
import { savePlanLocally, getGuestPlanCount } from '@/lib/storage'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import type { Plan, Badge } from '@/lib/types'
import { useTranslations, useLanguage } from '@/lib/i18n/LanguageContext'
import { Star } from 'lucide-react'
import BadgeUnlockToast from './BadgeUnlockToast'

interface Props {
  onPlanReady: (plan: Plan) => void
  onLoading: (loading: boolean) => void
}

export default function BrainDump({ onPlanReady, onLoading }: Props) {
  const { data: session } = useSession()
  const { locale } = useLanguage()
  const [tasks, setTasks] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [context, setContext] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [newBadges, setNewBadges] = useState<Badge[]>([])
  const t = useTranslations()

  const handleSubmit = async () => {
    if (!tasks.trim()) {
      toast.error(t('braindump.errorNoTasks'))
      return
    }

    setError('')
    setLoading(true)
    onLoading(true)

    try {
      const localDate = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, startTime, endTime, context, date: localDate, locale }),
      })

      const data = await res.json()
      if (!res.ok) {
        const errorMsg = data.error || 'Failed to generate schedule'
        if (errorMsg.includes('401') || errorMsg.includes('Invalid') || errorMsg.includes('Unauthorized')) {
          toast.error(t('braindump.errorInvalidKey'))
        } else if (errorMsg.includes('429')) {
          toast.error(t('braindump.errorRateLimit'))
        } else {
          toast.error(errorMsg)
        }
        throw new Error(errorMsg)
      }

      const plan: Plan = data
      savePlanLocally(plan)

      // Score update — now await to capture new badges
      if (session) {
        try {
          const scoreRes = await fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plan),
          })
          const scoreData = await scoreRes.json()
          if (scoreRes.ok && scoreData.newBadges?.length > 0) {
            setNewBadges(scoreData.newBadges)
          }
          if (scoreRes.ok && scoreData.pointsEarned) {
            toast.success(`+${scoreData.pointsEarned} ${t('profile.totalPoints')} ⚡`)
          }
        } catch (e) {
          console.error('Score update failed:', e)
        }
      }

      toast.success(t('braindump.successToast'))
      onPlanReady(plan)

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      if (!message.includes('Invalid API key') && !message.includes('Too many requests')) {
        setError(message)
      }
    } finally {
      setLoading(false)
      onLoading(false)
    }
  }

  const guestCount = typeof window !== 'undefined' ? getGuestPlanCount() : 0
  const showUpsell = !session && guestCount >= 3

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

      {/* Time pickers — 2 col on mobile, 3 col on sm+ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="sm:grid-cols-3">
        <TimeInput label={t('braindump.startTime')} value={startTime} onChange={setStartTime} />
        <TimeInput label={t('braindump.endTime')} value={endTime} onChange={setEndTime} />
        {/* Context spans full width on mobile, 1 col on sm+ */}
        <div style={{ gridColumn: '1 / -1' }} className="sm:col-auto">
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

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(247,92,106,0.1)', border: '1px solid rgba(247,92,106,0.3)', borderRadius: 8, color: '#f75c6a', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%',
          padding: '15px 24px',
          background: loading ? 'var(--border)' : 'linear-gradient(135deg, var(--accent), #9b8af7)',
          border: 'none', borderRadius: 12,
          color: '#fff', fontSize: 15, fontWeight: 700,
          fontFamily: 'Syne', cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.15s, transform 0.1s',
          letterSpacing: '-0.01em',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(124,106,247,0.35)',
        }}
        onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
      >
        {loading ? t('braindump.generating') : t('braindump.generate')}
      </button>
    </div>
  )
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, cursor: 'pointer' }}
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
  width: '100%', padding: '12px 14px',
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text)', fontSize: 14,
  fontFamily: 'DM Sans', outline: 'none',
  transition: 'border-color 0.15s',
  colorScheme: 'dark',
  minHeight: 46,
}