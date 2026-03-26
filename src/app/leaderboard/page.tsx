'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LeaderboardTable from '@/components/LeaderboardTable'
import type { LeaderboardEntry } from '@/lib/types'

export default function LeaderboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/signin'); return }
    if (status !== 'authenticated') return

    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => { setEntries(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status, router])

  const currentUserId = (session?.user as { id?: string })?.id

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(24px, 5vw, 40px)' }} className="px-4 sm:px-6">
      <div className="fade-up">
        <p style={{ fontSize: 12, fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 8 }}>
          Top planners
        </p>
        <h1 style={{ fontSize: 'clamp(24px, 7vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Leaderboard</h1>
        <p style={{ color: 'var(--muted)', fontSize: 'clamp(13px, 2.5vw, 14px)', marginBottom: 32 }}>
          Earn points by creating plans, maintaining streaks, and hitting perfect days.
        </p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 64, animationDelay: `${i * 0.05}s` }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🏆</div>
            <p>No rankings yet. Create a plan to get on the board!</p>
          </div>
        ) : (
          <LeaderboardTable entries={entries} currentUserId={currentUserId} />
        )}
      </div>
    </div>
  )
}