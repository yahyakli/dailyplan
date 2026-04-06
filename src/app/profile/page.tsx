'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BadgeCard from '@/components/BadgeCard'
import { BADGES, BADGE_CATEGORIES, getBadgeProgress } from '@/lib/scoring'
import type { BadgeId } from '@/lib/types'
import { useTranslations } from '@/lib/i18n/LanguageContext'

interface ProfileData {
  totalPoints: number
  weeklyPoints: number
  allTimePlans: number
  currentStreak: number
  longestStreak: number
  perfectDaysInARow: number
  unlockedBadges: { id: BadgeId; unlockedAt: string }[]
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const t = useTranslations()

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/signin'); return }
    if (status !== 'authenticated') return

    fetch('/api/profile')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status, router])

  if (status === 'loading' || loading) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(24px, 5vw, 40px)' }} className="px-4 sm:px-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <div className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%' }} />
          <div>
            <div className="skeleton" style={{ width: 140, height: 20, borderRadius: 6, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 200, height: 14, borderRadius: 6 }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 36 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    )
  }

  const unlockedIds = data?.unlockedBadges?.map(b => b.id) ?? []
  const totalBadges = Object.keys(BADGES).length
  const unlockedCount = unlockedIds.length
  const progressPercent = Math.round((unlockedCount / totalBadges) * 100)

  const stats = {
    allTimePlans: data?.allTimePlans ?? 0,
    currentStreak: data?.currentStreak ?? 0,
    perfectDaysInARow: data?.perfectDaysInARow ?? 0,
  }

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

        {/* Overall Badge Progress */}
        <div className="glass" style={{ padding: '16px 20px', borderRadius: 12, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>
              🏆 {t('profile.badges')}
            </span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              {unlockedCount} / {totalBadges}
            </span>
          </div>
          <div style={{
            width: '100%', height: 8, borderRadius: 4,
            background: 'var(--surface)', overflow: 'hidden',
          }}>
            <div className="progress-fill" style={{
              width: `${progressPercent}%`, height: '100%', borderRadius: 4,
              background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
        </div>

        {/* Badges by Category */}
        {Object.entries(BADGE_CATEGORIES).map(([key, category]) => (
          <div key={key} style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'Syne', fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t(`badges.categories.${key}`) || category.label}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
              {category.ids.map(id => {
                const unlocked = unlockedIds.includes(id)
                const unlockedEntry = data?.unlockedBadges?.find(b => b.id === id)
                const progress = !unlocked ? getBadgeProgress(id, stats) : undefined
                return (
                  <BadgeCard
                    key={id}
                    badge={BADGES[id]}
                    unlocked={unlocked}
                    unlockedAt={unlockedEntry?.unlockedAt}
                    progress={progress}
                  />
                )
              })}
            </div>
          </div>
        ))}

        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
          {t('profile.cta')}
        </p>
      </div>
    </div>
  )
}