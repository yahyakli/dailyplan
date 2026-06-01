'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from '@/i18n/navigation'
import LeaderboardTable from '@/components/LeaderboardTable'
import Podium from '@/components/LeaderboardPodium'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export default function LeaderboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('alltime')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<HTMLDivElement>(null)
  const t = useTranslations()

  const fetchEntries = useCallback(async (pageNum: number, reset = false) => {
    if (reset) setEntries([])
    const res = await fetch(`/api/leaderboard?period=${period}&page=${pageNum}`)
    const data = await res.json()

    setEntries(prev => reset ? data.rankings : [...prev, ...data.rankings])
    setHasMore(data.rankings.length > 0)
    setLoading(false)
  }, [period])

  useEffect(() => {
    setPage(1)
    fetchEntries(1, true)
  }, [period, fetchEntries])

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(p => p + 1)
        fetchEntries(page + 1)
      }
    }, { threshold: 1.0 })

    if (observerRef.current) observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, page, fetchEntries])

  const currentUserId = (session?.user as { id?: string })?.id

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 fade-up">
      <h1 className="text-3xl font-bold font-heading mb-6">{t('leaderboard.title')}</h1>

      <div className="flex gap-2 mb-6">
        {['alltime', 'month', 'week'].map(p => (
          <Button key={p} variant={period === p ? 'default' : 'outline'} onClick={() => setPeriod(p)}>
            {t(`leaderboard.${p}`)}
          </Button>
        ))}
      </div>

      {loading && page === 1 ? (
        <div className="space-y-4">
            <div className="h-40 skeleton rounded-xl" />
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
        </div>
      ) : (
        <>
          <Podium entries={entries} />
          <LeaderboardTable entries={entries} currentUserId={currentUserId} />
          <div ref={observerRef} className="h-10" />
        </>
      )}
    </div>
  )
}