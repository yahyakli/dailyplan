'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BadgeCard from '@/components/BadgeCard'
import { BADGES, BADGE_CATEGORIES, getBadgeProgress } from '@/lib/scoring'
import type { BadgeId } from '@/lib/types'
import { useTranslations } from '@/lib/i18n/LanguageContext'

interface BadgeData {
  allTimePlans: number
  currentStreak: number
  perfectDaysInARow: number
  unlockedBadges: { id: BadgeId; unlockedAt: string }[]
}

export default function BadgesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<BadgeData | null>(null)
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

  const unlockedIds = data?.unlockedBadges?.map(b => b.id) ?? []
  const totalBadges = Object.keys(BADGES).length
  const unlockedCount = unlockedIds.length
  const progressPercent = Math.round((unlockedCount / totalBadges) * 100)

  const stats = {
    allTimePlans: data?.allTimePlans ?? 0,
    currentStreak: data?.currentStreak ?? 0,
    perfectDaysInARow: data?.perfectDaysInARow ?? 0,
  }

  // Find next badge to unlock
  const nextBadge = (Object.keys(BADGES) as BadgeId[]).find(id => {
    if (unlockedIds.includes(id)) return false
    const progress = getBadgeProgress(id, stats)
    return progress.percentage > 0
  })

  if (status === 'loading' || loading) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(24px, 5vw, 40px)' }} className="px-4 sm:px-6">
        <div className="skeleton" style={{ width: 160, height: 28, borderRadius: 8, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 280, height: 16, borderRadius: 6, marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(24px, 5vw, 40px)' }} className="px-4 sm:px-6">
      <div className="fade-up">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 'clamp(24px, 6vw, 32px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            marginBottom: 8,
          }}>
            🏅 {t('badges.title') || 'Badges'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 'clamp(13px, 2.5vw, 15px)' }}>
            {t('badges.subtitle') || 'Earn badges by creating plans, building streaks, and mastering your schedule.'}
          </p>
        </div>

        {/* Overall progress */}
        <div className="glass" style={{
          padding: '20px 24px',
          borderRadius: 14,
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18 }}>
                {unlockedCount}
              </span>
              <span style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 4 }}>
                / {totalBadges} {t('badges.unlocked') || 'unlocked'}
              </span>
            </div>
            <span style={{
              fontFamily: 'Syne',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--accent)',
            }}>
              {progressPercent}%
            </span>
          </div>
          <div style={{
            width: '100%', height: 10, borderRadius: 5,
            background: 'var(--surface)', overflow: 'hidden',
          }}>
            <div className="progress-fill" style={{
              width: `${progressPercent}%`,
              height: '100%',
              borderRadius: 5,
              background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
        </div>

        {/* Next badge to unlock */}
        {nextBadge && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{
              fontFamily: 'Syne', fontSize: 12, fontWeight: 700,
              color: 'var(--accent)', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: 10,
            }}>
              {t('badges.nextUp') || '⚡ Next up'}
            </h2>
            <div style={{
              background: 'rgba(124,106,247,0.06)',
              border: '1px solid rgba(124,106,247,0.2)',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              <BadgeCard
                badge={BADGES[nextBadge]}
                unlocked={false}
                progress={getBadgeProgress(nextBadge, stats)}
              />
            </div>
          </div>
        )}

        {/* Badges by Category */}
        {Object.entries(BADGE_CATEGORIES).map(([key, category]) => {
          const categoryUnlocked = category.ids.filter(id => unlockedIds.includes(id)).length
          return (
            <div key={key} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h2 style={{
                  fontFamily: 'Syne', fontSize: 14, fontWeight: 700,
                  color: 'var(--muted)', textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {t(`badges.categories.${key}`) || category.label}
                </h2>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {categoryUnlocked}/{category.ids.length}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
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
          )
        })}

        {/* Motivational CTA */}
        <div style={{
          textAlign: 'center',
          padding: '24px 16px',
          borderRadius: 14,
          background: 'rgba(124,106,247,0.04)',
          border: '1px solid rgba(124,106,247,0.1)',
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🚀</div>
          <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 340, margin: '0 auto', lineHeight: 1.6 }}>
            {t('badges.cta') || 'Keep creating plans to unlock all badges and become the ultimate planner!'}
          </p>
        </div>
      </div>
    </div>
  )
}
