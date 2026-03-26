'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BadgeCard from '@/components/BadgeCard'
import { BADGES } from '@/lib/scoring'
import type { BadgeId } from '@/lib/types'
import { useTranslations } from '@/lib/i18n/LanguageContext'

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
  const t = useTranslations()

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/signin'); return }
  }, [status, router])

  if (status === 'loading') return null

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(24px, 5vw, 40px)' }} className="px-4 sm:px-6">
      <div className="fade-up">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36, flexWrap: 'wrap' }} className="xs:flex-col sm:flex-row">
          {session?.user?.image ? (
            <img src={session.user.image} alt="" style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {session?.user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              {session?.user?.name}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>{session?.user?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12, marginBottom: 36 }} className="xs:grid-cols-2 sm:grid-cols-4">
          {[
            { emoji: '📋', label: t('profile.plansCreated'), value: data?.allTimePlans ?? '—' },
            { emoji: '🔥', label: t('profile.currentStreak'), value: data?.currentStreak != null ? `${data.currentStreak} ${t('profile.days')}` : '—' },
            { emoji: '⚡', label: t('profile.bestStreak'), value: data?.longestStreak != null ? `${data.longestStreak} ${t('profile.days')}` : '—' },
            { emoji: '✨', label: t('profile.totalPoints'), value: data?.totalPoints?.toLocaleString() ?? '—' },
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
            {t('profile.badges')}
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
          {t('profile.cta')}
        </p>
      </div>
    </div>
  )
}