'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getPlanByDate, getRecentPlans } from '@/lib/storage'
import ScheduleView from '@/components/ScheduleView'
import type { Plan } from '@/lib/types'
import { Suspense } from 'react'

function PlanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to load plan by date param, or fall back to most recent
    const dateParam = searchParams.get('date')

    if (dateParam) {
      const found = getPlanByDate(dateParam)
      if (found) { setPlan(found); setLoading(false); return }
    }

    // Fall back to most recent plan
    const recent = getRecentPlans(1)
    if (recent.length > 0) {
      setPlan(recent[0])
    }
    setLoading(false)
  }, [searchParams])

  if (loading) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, color: 'var(--muted)', fontFamily: 'Syne', marginBottom: 8 }}>Loading plan...</div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 72, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
        <div className="fade-up" style={{ paddingTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📅</div>
          <h2 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>No plan found</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
            This plan doesn&apos;t exist or hasn&apos;t been created yet.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, var(--accent), #9b8af7)',
              border: 'none', borderRadius: 8,
              color: '#fff', fontFamily: 'Syne', fontWeight: 700,
              fontSize: 14, cursor: 'pointer',
            }}
          >
            Create today&apos;s plan →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
      <ScheduleView
        plan={plan}
        onReset={() => router.push('/')}
      />
    </div>
  )
}

export default function PlanPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 72 }} />
          ))}
        </div>
      </div>
    }>
      <PlanContent />
    </Suspense>
  )
}