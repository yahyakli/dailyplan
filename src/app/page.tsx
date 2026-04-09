'use client'
import { useState, useEffect } from 'react'
import BrainDump from '@/components/BrainDump'
import ScheduleView from '@/components/ScheduleView'
import type { Plan } from '@/lib/types'
import { useTranslations } from '@/lib/i18n/LanguageContext'
import { getPlanByDate } from '@/lib/storage'

export default function Home() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)
  const t = useTranslations()

  useEffect(() => {
    // Check for today's plan in local storage on mount (for persistent Guest experience)
    const today = new Date().toISOString().split('T')[0]
    const localPlan = getPlanByDate(today)
    if (localPlan) {
      setPlan(localPlan)
    }
  }, [])

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(20px, 5vw, 40px) clamp(16px, 4vw, 32px)' }}>

        {!plan && !loading && (
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 10 }}>
              {t('home.headline')}
              <br />
              <span className="gradient-text">{t('home.headlineAccent')}</span>
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 'clamp(14px, 2.5vw, 15px)' }}>
              {t('home.subtitle')}
            </p>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            <div style={{ fontSize: 14, color: 'var(--muted)', fontFamily: 'Syne' }}>{t('home.scheduling')}</div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 72, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {plan && !loading ? (
          <ScheduleView plan={plan} onReset={() => setPlan(null)} />
        ) : !loading ? (
          <BrainDump onPlanReady={setPlan} onLoading={setLoading} />
        ) : null}

      </div>
  )
}