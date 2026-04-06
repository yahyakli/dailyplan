'use client'
import type { Plan } from '@/lib/types'
import ScheduleBlock from './ScheduleBlock'
import OverflowList from './OverflowList'
import { useTranslations, useLanguage } from '@/lib/i18n/LanguageContext'

interface Props {
  plan: Plan
  onReset?: () => void
}

export default function ScheduleView({ plan, onReset }: Props) {
  const t = useTranslations()
  const { locale } = useLanguage()

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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, flexDirection: 'row' }} className="xs:flex-col sm:flex-row">
        <div>
          <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t('schedule.yourSchedule')}
          </p>
          <h2 style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 700, letterSpacing: '-0.03em' }}>
            {new Date(plan.date + 'T12:00:00').toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8, width: '100%' }} className="xs:w-full sm:w-auto">
          <button onClick={copyAsText} style={{...actionBtnStyle, flex: 1}} className="sm:flex-none">
            {t('schedule.copyAsText')}
          </button>
          {onReset && (
            <button onClick={onReset} style={{ ...actionBtnStyle, borderColor: 'var(--accent)', color: 'var(--accent)', flex: 1 }} className="sm:flex-none">
              {t('schedule.newPlan')}
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
          { label: t('schedule.blocks'), value: plan.blocks.length },
          { label: t('schedule.overflow'), value: plan.overflow.length },
          { label: t('schedule.highPriority'), value: plan.blocks.filter(b => b.priority === 'high').length },
        ].map(stat => (
          <div key={stat.label} className="glass" style={{ padding: '8px 16px', borderRadius: 8, flex: '1 1 80px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne' }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {plan.blocks.map((block, i) => {
          const next = plan.blocks[i + 1]
          const gapMin = next ? calcGapMinutes(block.endTime, next.startTime) : 0
          return (
            <div key={`${block.startTime}-${i}`}>
              <ScheduleBlock block={block} index={i} />
              {gapMin > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '4px 16px', margin: '2px 0',
                }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.5 }} />
                  <span style={{
                    fontSize: 10, color: 'var(--muted)', fontFamily: 'Syne',
                    fontWeight: 600, letterSpacing: '0.08em', whiteSpace: 'nowrap',
                    opacity: 0.7,
                  }}>
                    · {gapMin} min ·
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.5 }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Overflow */}
      {plan.overflow.length > 0 && (
        <OverflowList tasks={plan.overflow} />
      )}
    </div>
  )
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function calcGapMinutes(endTime: string, nextStart: string): number {
  const gap = timeToMinutes(nextStart) - timeToMinutes(endTime)
  return gap > 0 ? gap : 0
}

const actionBtnStyle: React.CSSProperties = {
  padding: '7px 14px',
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--muted)', cursor: 'pointer',
  fontSize: 13, fontWeight: 500, transition: 'color 0.15s, border-color 0.15s',
}