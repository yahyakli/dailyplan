import type { Plan, BlockCategory } from '@/lib/types'
import { Check, ChevronRight, Lightbulb } from 'lucide-react'

const CATEGORY_COLORS: Record<BlockCategory, string> = {
  'deep-work':     'var(--deep-work)',
  'communication': 'var(--communication)',
  'admin':         'var(--admin)',
  'personal':      'var(--personal)',
  'break':         'var(--break)',
}

interface Props {
  plan: Plan
  onClick?: () => void
  index?: number
}

export default function HistoryCard({ plan, onClick, index = 0 }: Props) {
  const date = new Date(plan.date + 'T12:00:00')
  const isToday = plan.date === new Date().toISOString().split('T')[0]
  const isPerfect = plan.overflow.length === 0

  // Build a mini category bar showing time distribution
  const categoryCounts = plan.blocks.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const total = plan.blocks.length || 1

  return (
    <button
      onClick={onClick}
      className="glass fade-up"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '16px 18px',
        borderRadius: 12,
        background: 'none',
        border: `1px solid ${isToday ? 'rgba(124,106,247,0.4)' : 'var(--border)'}`,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'border-color 0.15s, transform 0.1s',
        animationDelay: `${index * 0.05}s`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isToday ? 'rgba(124,106,247,0.4)' : 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Date box */}
        <div style={{
          minWidth: 44, height: 44, borderRadius: 8,
          background: isToday ? 'rgba(124,106,247,0.15)' : 'var(--surface)',
          border: `1px solid ${isToday ? 'rgba(124,106,247,0.3)' : 'var(--border)'}`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 16, fontFamily: 'Syne', fontWeight: 800, lineHeight: 1, color: isToday ? 'var(--accent)' : 'var(--text)' }}>
            {date.getDate()}
          </span>
          <span style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {date.toLocaleDateString('en-US', { month: 'short' })}
          </span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 14 }}>
              {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
            {isToday && (
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(124,106,247,0.2)', color: 'var(--accent)', fontWeight: 600, fontFamily: 'Syne' }}>
                TODAY
              </span>
            )}
            {isPerfect && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(62,207,150,0.15)', color: '#3ecf96', fontWeight: 600, fontFamily: 'Syne' }}>
                <Check size={12} strokeWidth={3} /> Perfect
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>{plan.blocks.length} blocks</span>
            {plan.overflow.length > 0 && (
              <span style={{ color: '#f7c76a' }}>{plan.overflow.length} overflow</span>
            )}
            {plan.blocks.filter(b => b.priority === 'high').length > 0 && (
              <span>{plan.blocks.filter(b => b.priority === 'high').length} high priority</span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <span style={{ color: 'var(--muted)', marginTop: 2 }}><ChevronRight size={18} strokeWidth={2} /></span>
      </div>

      {/* Category bar */}
      {plan.blocks.length > 0 && (
        <div style={{ display: 'flex', height: 4, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
          {(Object.entries(categoryCounts) as [BlockCategory, number][]).map(([cat, count]) => (
            <div
              key={cat}
              title={`${cat} (${count})`}
              style={{
                flex: count / total,
                background: CATEGORY_COLORS[cat] || 'var(--border)',
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      )}

      {/* Insight preview */}
      {plan.insight && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lightbulb size={12} color="var(--accent)" style={{ flexShrink: 0 }} />
          <p style={{
            flex: 1, minWidth: 0,
            fontSize: 12, color: 'var(--muted)', lineHeight: 1.5,
            fontStyle: 'italic',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {plan.insight}
          </p>
        </div>
      )}
    </button>
  )
}