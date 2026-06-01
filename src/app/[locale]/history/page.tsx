'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import type { Plan } from '@/lib/types'
import HistoryCard from '@/components/HistoryCard'
import PlanDetailDrawer from '@/components/PlanDetailDrawer'
import { useTranslations } from 'next-intl'
import { CalendarDays } from 'lucide-react'

export default function HistoryPage() {
  const { data: session } = useSession()
  const [plans, setPlans] = useState<Plan[]>([])
  const [selected, setSelected] = useState<Plan | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)
  const t = useTranslations()

  const fetchPlans = useCallback(async (reset = false) => {
    if (loading || (!hasMore && !reset)) return
    setLoading(true)
    try {
      const url = `/api/history?limit=10${cursor && !reset ? `&cursor=${cursor}` : ''}`
      const res = await fetch(url)
      const data = await res.json()

      setPlans(prev => reset ? data.items : [...prev, ...data.items])
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [cursor, hasMore, loading])

  useEffect(() => {
    fetchPlans(true)
  }, []) // Initial fetch

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        fetchPlans()
      }
    }, { threshold: 1.0 })

    if (observerRef.current) observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, fetchPlans])

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

        {plans.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            <CalendarDays size={48} strokeWidth={1} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: 15 }}>{t('history.empty')} <a href="/" style={{ color: 'var(--accent)' }}>{t('history.createFirst')}</a></p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {plans.map((plan, i) => (
              <HistoryCard
                key={plan._id || i}
                plan={plan}
                index={i}
                onClick={() => setSelected(plan)}
              />
            ))}
            <div ref={observerRef} className="h-4" />
          </div>
        )}
      </div>

      {selected && <PlanDetailDrawer plan={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}