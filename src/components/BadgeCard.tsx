import type { Badge } from '@/lib/types'

export default function BadgeCard({ badge, unlocked = false }: { badge: Badge; unlocked?: boolean }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 10,
      background: unlocked ? 'rgba(124,106,247,0.08)' : 'var(--surface)',
      border: `1px solid ${unlocked ? 'rgba(124,106,247,0.3)' : 'var(--border)'}`,
      opacity: unlocked ? 1 : 0.45,
      display: 'flex', alignItems: 'center', gap: 12,
      transition: 'opacity 0.2s',
    }}>
      <span style={{ fontSize: 24, filter: unlocked ? 'none' : 'grayscale(1)' }}>
        {badge.emoji}
      </span>
      <div>
        <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 13 }}>{badge.label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{badge.description}</div>
      </div>
      {unlocked && (
        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--accent)', fontWeight: 600, fontFamily: 'Syne', textTransform: 'uppercase' }}>
          Unlocked
        </div>
      )}
    </div>
  )
}