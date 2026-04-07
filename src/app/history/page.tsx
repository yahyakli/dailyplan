'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getRecentPlans } from '@/lib/storage'
import type { Plan } from '@/lib/types'
import ScheduleView from '@/components/ScheduleView'
import HistoryCard from '@/components/HistoryCard'
import { useTranslations } from '@/lib/i18n/LanguageContext'
import { CalendarDays } from 'lucide-react'

export default function HistoryPage() {
  const { data: session } = useSession()
  const [plans, setPlans] = useState<Plan[]>([])
  const [selected, setSelected] = useState<Plan | null>(null)
  const t = useTranslations()

  useEffect(() => {
    const local = getRecentPlans(7)
    setPlans(local)
  }, [])

  if (selected) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(24px, 5vw, 40px)' }} className="px-4 sm:px-6">
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, marginBottom: 24, padding: 0 }}>
          {t('history.backToHistory')}
        </button>
        <ScheduleView plan={selected} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(24px, 5vw, 40px)' }} className="px-4 sm:px-6">
      <div className="fade-up">
        <p style={{ fontSize: 12, fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 8 }}>
          {session ? t('history.yourPlans') : t('history.recentLocal')}
        </p>
        <h1 style={{ fontSize: 'clamp(24px, 7vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 32 }}>{t('history.title')}</h1>

        {!session && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)', marginBottom: 24, fontSize: 13, color: 'var(--muted)' }}>
            {t('history.guestNotice')}{' '}
            <a href="/auth/signup" style={{ color: 'var(--accent)' }}>{t('history.guestSignup')}</a>{' '}{t('history.guestSignupSuffix')}
          </div>
        )}

        {plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            <CalendarDays size={48} strokeWidth={1} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: 15 }}>{t('history.empty')} <a href="/" style={{ color: 'var(--accent)' }}>{t('history.createFirst')}</a></p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {plans.map((plan, i) => (
              <HistoryCard
                key={plan.date}
                plan={plan}
                index={i}
                onClick={() => setSelected(plan)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}