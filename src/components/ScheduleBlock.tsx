import type { Block } from '@/lib/types'
import { Target, MessageCircle, ClipboardList, Leaf, Coffee, Pin } from 'lucide-react'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'deep-work':     <Target size={18} strokeWidth={2} />,
  'communication': <MessageCircle size={18} strokeWidth={2} />,
  'admin':         <ClipboardList size={18} strokeWidth={2} />,
  'personal':      <Leaf size={18} strokeWidth={2} />,
  'break':         <Coffee size={18} strokeWidth={2} />,
}

export default function ScheduleBlock({ block, index }: { block: Block; index: number }) {
  const icon = CATEGORY_ICONS[block.category] || <Pin size={18} strokeWidth={2} />
  const isBreak = block.category === 'break'

  if (isBreak) {
    return (
      <div
        className="fade-up"
        style={{
          border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: 12,
          padding: 'clamp(10px, 3vw, 14px) clamp(12px, 4vw, 16px)',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          background: 'rgba(251,191,36,0.06)',
          animationDelay: `${index * 0.05}s`,
          marginBottom: 8,
        }}
      >
        {/* Icon */}
        <div style={{ flexShrink: 0, color: 'rgba(251,191,36,0.9)', display: 'flex', alignItems: 'center' }}>{icon}</div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 14, color: 'rgba(251,191,36,0.9)' }}>
            {block.title}
          </span>
          {block.notes && (
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>
              {block.notes}
            </p>
          )}
        </div>

        {/* Time badge — right side */}
        <div style={{
          flexShrink: 0, textAlign: 'right',
          background: 'rgba(251,191,36,0.1)', borderRadius: 8,
          padding: '4px 8px', border: '1px solid rgba(251,191,36,0.2)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(251,191,36,0.9)', fontFamily: 'Syne', whiteSpace: 'nowrap' }}>
            {block.startTime}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.8, whiteSpace: 'nowrap' }}>
            → {block.endTime}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`fade-up cat-${block.category}`}
      style={{
        border: '1px solid',
        borderRadius: 12,
        padding: 'clamp(10px, 3vw, 14px) clamp(12px, 4vw, 16px)',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        animationDelay: `${index * 0.05}s`,
        marginBottom: 8,
      }}
    >
      {/* Icon */}
      <div style={{ paddingTop: 2, flexShrink: 0, opacity: 0.8 }}>{icon}</div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title + badges row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'nowrap' }}>
          <span style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 'clamp(13px, 3.5vw, 14px)', lineHeight: 1.3 }}>
            {block.title}
          </span>
          {/* Time badge — compact on mobile */}
          <div style={{
            flexShrink: 0, textAlign: 'right',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', fontFamily: 'Syne', whiteSpace: 'nowrap' }}>
              {block.startTime}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.6, whiteSpace: 'nowrap' }}>
              → {block.endTime}
            </div>
          </div>
        </div>

        {/* Category + priority chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            fontSize: 10, fontWeight: 600, padding: '2px 7px',
            borderRadius: 12, border: '1px solid', opacity: 0.85,
            textTransform: 'uppercase', letterSpacing: '0.04em',
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
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, lineHeight: 1.55 }}>
            {block.notes}
          </p>
        )}
      </div>
    </div>
  )
}