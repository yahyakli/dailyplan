'use client'
import type { Plan } from '@/lib/types'
import ScheduleBlock from './ScheduleBlock'
import OverflowList from './OverflowList'

interface Props {
  plan: Plan
  onReset?: () => void
}

export default function ScheduleView({ plan, onReset }: Props) {
  const copyAsText = () => {
    const lines = [
      `DailyPlan — ${plan.date}`,
      '─'.repeat(40),
      ...plan.blocks.map(b => `${b.startTime}–${b.endTime}  ${b.title} [${b.category}]`),
      ...(plan.overflow.length ? ['\nDid not fit:', ...plan.overflow.map(t => `  • ${t}`)] : []),
      `\n💡 ${plan.insight}`,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Your schedule
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>
            {new Date(plan.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copyAsText} style={actionBtnStyle}>
            Copy as text
          </button>
          {onReset && (
            <button onClick={onReset} style={{ ...actionBtnStyle, borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              New plan
            </button>
          )}
        </div>
      </div>

      {/* AI Insight */}
      {plan.insight && (
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, fontStyle: 'italic' }}>
            {plan.insight}
          </p>
        </div>
      )}

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Blocks', value: plan.blocks.length },
          { label: 'Overflow', value: plan.overflow.length },
          { label: 'High priority', value: plan.blocks.filter(b => b.priority === 'high').length },
        ].map(stat => (
          <div key={stat.label} className="glass" style={{ padding: '8px 16px', borderRadius: 8, flex: '1 1 80px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne' }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {plan.blocks.map((block, i) => (
          <ScheduleBlock key={`${block.startTime}-${i}`} block={block} index={i} />
        ))}
      </div>

      {/* Overflow */}
      {plan.overflow.length > 0 && (
        <OverflowList tasks={plan.overflow} />
      )}
    </div>
  )
}

const actionBtnStyle: React.CSSProperties = {
  padding: '7px 14px',
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--muted)', cursor: 'pointer',
  fontSize: 13, fontWeight: 500, transition: 'color 0.15s, border-color 0.15s',
}