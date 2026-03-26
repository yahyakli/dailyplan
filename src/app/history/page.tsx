'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getRecentPlans } from '@/lib/storage'
import type { Plan } from '@/lib/types'
import ScheduleView from '@/components/ScheduleView'
import HistoryCard from '@/components/HistoryCard'

export default function HistoryPage() {
  const { data: session } = useSession()
  const [plans, setPlans] = useState<Plan[]>([])
  const [selected, setSelected] = useState<Plan | null>(null)

  useEffect(() => {
    // For now, always load from localStorage (works for guests + auth users)
    const local = getRecentPlans(7)
    setPlans(local)
  }, [])

  if (selected) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(24px, 5vw, 40px)' }} className="px-4 sm:px-6">
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, marginBottom: 24, padding: 0 }}>
          ← Back to history
        </button>
        <ScheduleView plan={selected} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(24px, 5vw, 40px)' }} className="px-4 sm:px-6">
      <div className="fade-up">
        <p style={{ fontSize: 12, fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 8 }}>
          {session ? 'Your plans' : 'Recent (local)'}
        </p>
        <h1 style={{ fontSize: 'clamp(24px, 7vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 32 }}>History</h1>

        {!session && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)', marginBottom: 24, fontSize: 13, color: 'var(--muted)' }}>
            Showing last 7 plans from this device.{' '}
            <a href="/auth/signup" style={{ color: 'var(--accent)' }}>Sign up</a> for unlimited history across devices.
          </div>
        )}

        {plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
            <p style={{ fontSize: 15 }}>No plans yet. <a href="/" style={{ color: 'var(--accent)' }}>Create your first one →</a></p>
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