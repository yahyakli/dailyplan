import type { LeaderboardEntry } from '@/lib/types'
import { BADGES } from '@/lib/scoring'

export default function LeaderboardTable({ entries, currentUserId }: {
  entries: LeaderboardEntry[]
  currentUserId?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {entries.map((entry, i) => {
        const isMe = entry.userId === currentUserId
        const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

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
            <div style={{ minWidth: 36, textAlign: 'center' }}>
              {rankEmoji ? (
                <span style={{ fontSize: 20 }}>{rankEmoji}</span>
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
                  {isMe && <span style={{ color: 'var(--accent)', marginLeft: 6, fontSize: 12 }}>(you)</span>}
                </span>
                <span style={{ display: 'flex', gap: 2 }}>
                  {entry.topBadges.map(bid => (
                    <span key={bid} title={BADGES[bid]?.label} style={{ fontSize: 13 }}>
                      {BADGES[bid]?.emoji}
                    </span>
                  ))}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                <Stat label="plans" value={entry.allTimePlans} />
                <Stat label="streak" value={`${entry.currentStreak}🔥`} />
              </div>
            </div>

            {/* Points */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {entry.totalPoints.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>pts</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
      {value} <span style={{ opacity: 0.6 }}>{label}</span>
    </span>
  )
}