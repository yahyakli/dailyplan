'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BadgeCard from '@/components/BadgeCard'
import { BADGES } from '@/lib/scoring'
import type { BadgeId } from '@/lib/types'

interface ProfileData {
  totalPoints: number
  weeklyPoints: number
  allTimePlans: number
  currentStreak: number
  longestStreak: number
  unlockedBadges: { id: BadgeId; unlockedAt: string }[]
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<ProfileData | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/signin'); return }
  }, [status, router])

  // Build profile from available data
  // (In a full app you'd have a /api/profile endpoint; for now we show what we have)

  if (status === 'loading') return null

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
      <div className="fade-up">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          {session?.user?.image ? (
            <img src={session.user.image} alt="" style={{ width: 56, height: 56, borderRadius: '50%' }} />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: '#fff',
            }}>
              {session?.user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>
              {session?.user?.name}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>{session?.user?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 36 }}>
          {[
            { emoji: '📋', label: 'Plans created', value: data?.allTimePlans ?? '—' },
            { emoji: '🔥', label: 'Current streak', value: data?.currentStreak != null ? `${data.currentStreak} days` : '—' },
            { emoji: '⚡', label: 'Best streak', value: data?.longestStreak != null ? `${data.longestStreak} days` : '—' },
            { emoji: '✨', label: 'Total points', value: data?.totalPoints?.toLocaleString() ?? '—' },
          ].map(stat => (
            <div key={stat.label} className="glass" style={{ padding: '16px', borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.emoji}</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div>
          <h2 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
            Badges
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
            {(Object.keys(BADGES) as BadgeId[]).map(id => {
              const unlockedEntry = data?.unlockedBadges?.find(b => b.id === id)
              return (
                <BadgeCard
                  key={id}
                  badge={BADGES[id]}
                  unlocked={!!unlockedEntry}
                />
              )
            })}
          </div>
        </div>

        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
          Create more plans to unlock badges and climb the leaderboard!
        </p>
      </div>
    </div>
  )
}