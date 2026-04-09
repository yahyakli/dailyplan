import type { LeaderboardEntry } from '@/lib/types'
import { BADGES } from '@/lib/scoring'
import BadgeIcon from './BadgeIcon'
import { Trophy, Medal, Award, Flame } from 'lucide-react'
import { useTranslations } from '@/lib/i18n/LanguageContext'

export default function LeaderboardTable({ entries, currentUserId }: {
  entries: LeaderboardEntry[]
  currentUserId?: string
}) {
  const t = useTranslations()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {entries.map((entry, i) => {
        const isMe = entry.userId === currentUserId
        const RankIcon = i === 0 ? Trophy : i === 1 ? Medal : i === 2 ? Award : null
        const rankColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : undefined

        return (
          <div
            key={entry.userId}
            className={`fade-up ${isMe ? '' : 'glass'}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', borderRadius: 10,
              background: isMe ? 'rgba(124,106,247,0.12)' : undefined,
              border: isMe ? '1px solid rgba(124,106,247,0.4)' : undefined,
              transition: 'opacity 0.15s',
              animationDelay: `${i * 0.03}s`,
            }}
          >
            {/* Rank */}
            <div style={{ minWidth: 36, display: 'flex', justifyContent: 'center' }}>
              {RankIcon ? (
                <RankIcon size={22} color={rankColor} strokeWidth={2.5} />
              ) : (
                <span style={{ fontSize: 13, fontFamily: 'Syne', fontWeight: 700, color: 'var(--muted)' }}>
                  #{entry.rank}
                </span>
              )}
            </div>

            {/* Avatar */}
            {entry.image ? (
              <img src={entry.image} alt="" style={{ width: 34, height: 34, borderRadius: '50%' }} />
            ) : (
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: `hsl(${(entry.userId.charCodeAt(0) * 37) % 360}, 60%, 45%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#fff',
              }}>
                {entry.name[0]?.toUpperCase()}
              </div>
            )}

            {/* Name + badges */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.name}
                  {isMe && <span style={{ color: 'var(--accent)', marginLeft: 6, fontSize: 12 }}>({t('leaderboard.you')})</span>}
                </span>
                <span style={{ display: 'flex', gap: 4, color: 'var(--accent)' }}>
                  {entry.topBadges.map(bid => (
                    <span key={bid} title={BADGES[bid]?.label} style={{ display: 'flex', alignItems: 'center' }}>
                      <BadgeIcon name={BADGES[bid]?.iconName} size={14} strokeWidth={2.5} />
                    </span>
                  ))}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                <Stat label={t('history.blocks')} value={entry.allTimePlans} />
                <Stat label={t('profile.currentStreak')} value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>{entry.currentStreak}<Flame size={12} color="#f75c6a" strokeWidth={3} /></span>} />
              </div>
            </div>

            {/* Points */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {entry.totalPoints.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('leaderboard.pts')}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <span style={{ fontSize: 11, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {value} <span style={{ opacity: 0.6 }}>{label}</span>
    </span>
  )
}