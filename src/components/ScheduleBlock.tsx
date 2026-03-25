import type { Block } from '@/lib/types'

const CATEGORY_ICONS: Record<string, string> = {
  'deep-work':     '🎯',
  'communication': '💬',
  'admin':         '📋',
  'personal':      '🌱',
  'break':         '☕',
}

export default function ScheduleBlock({ block, index }: { block: Block; index: number }) {
  const icon = CATEGORY_ICONS[block.category] || '📌'

  return (
    <div
      className={`fade-up cat-${block.category}`}
      style={{
        border: '1px solid',
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        animationDelay: `${index * 0.05}s`,
      }}
    >
      {/* Time column */}
      <div style={{ minWidth: 80, paddingTop: 2 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', fontFamily: 'Syne' }}>
          {block.startTime}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.6 }}>
          → {block.endTime}
        </div>
      </div>

      {/* Icon */}
      <div style={{ fontSize: 18, paddingTop: 2 }}>{icon}</div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 14 }}>
            {block.title}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 600, padding: '2px 7px',
            borderRadius: 12, border: '1px solid', opacity: 0.8,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}
            className={`cat-${block.category}`}
          >
            {block.category}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)' }}>
            <span className={`priority-${block.priority}`} style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%' }} />
            {block.priority}
          </span>
        </div>
        {block.notes && (
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 5, lineHeight: 1.5 }}>
            {block.notes}
          </p>
        )}
      </div>
    </div>
  )
}