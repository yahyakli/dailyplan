'use client'
import type { Badge } from '@/lib/types'
import BadgeIcon from './BadgeIcon'

interface BadgeCardProps {
  badge: Badge
  unlocked?: boolean
  unlockedAt?: string
  progress?: { current: number; target: number; percentage: number }
}

export default function BadgeCard({ badge, unlocked = false, unlockedAt, progress }: BadgeCardProps) {
  const showProgress = !unlocked && progress && progress.target > 1 && progress.current > 0

  return (
    <div
      className={unlocked ? 'badge-card-unlocked' : 'badge-card-locked'}
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        background: unlocked ? 'rgba(124,106,247,0.08)' : 'var(--surface)',
        border: `1px solid ${unlocked ? 'rgba(124,106,247,0.3)' : 'var(--border)'}`,
        opacity: unlocked ? 1 : 0.55,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = unlocked
          ? '0 4px 20px rgba(124,106,247,0.15)'
          : '0 2px 8px rgba(0,0,0,0.1)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Emoji */}
      <div style={{
        filter: unlocked ? 'none' : 'grayscale(1)',
        opacity: unlocked ? 1 : 0.6,
        transition: 'filter 0.3s, opacity 0.3s',
        flexShrink: 0,
        width: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: unlocked ? 'var(--accent)' : 'var(--muted)'
      }}>
        <BadgeIcon name={badge.iconName} size={28} strokeWidth={2} />
      </div>

      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Syne',
          fontWeight: 600,
          fontSize: 13,
          marginBottom: 2,
          color: unlocked ? 'var(--text)' : 'var(--muted)',
        }}>
          {badge.label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: showProgress ? 6 : 0 }}>
          {badge.description}
        </div>

        {/* Progress bar for locked badges */}
        {showProgress && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: 'var(--border)',
              overflow: 'hidden',
            }}>
              <div className="progress-fill" style={{
                width: `${progress.percentage}%`,
                height: '100%',
                borderRadius: 2,
                background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>
            <span style={{
              fontSize: 10,
              color: 'var(--muted)',
              fontFamily: 'Syne',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              {progress.current}/{progress.target}
            </span>
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div style={{ marginLeft: 'auto', flexShrink: 0, textAlign: 'right' }}>
        {unlocked ? (
          <div>
            <div style={{
              fontSize: 10,
              color: 'var(--accent)',
              fontWeight: 600,
              fontFamily: 'Syne',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              ✓ Unlocked
            </div>
            {unlockedAt && (
              <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>
                {new Date(unlockedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BadgeIcon name="Lock" size={12} strokeWidth={2.5} color="var(--muted)" />
          </div>
        )}
      </div>
    </div>
  )
}