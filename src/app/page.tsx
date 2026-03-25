'use client'
import { useState } from 'react'
import KeyGate from '@/components/KeyGate'
import BrainDump from '@/components/BrainDump'
import ScheduleView from '@/components/ScheduleView'
import type { Plan } from '@/lib/types'

export default function Home() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <KeyGate>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>

        {!plan && !loading && (
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 10 }}>
              What&apos;s on your plate<br />
              <span className="gradient-text">today?</span>
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 15 }}>
              Brain-dump everything. Mistral turns it into a realistic time-blocked day.
            </p>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            <div style={{ fontSize: 14, color: 'var(--muted)', fontFamily: 'Syne' }}>Scheduling your day...</div>
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
    </KeyGate>
  )
}