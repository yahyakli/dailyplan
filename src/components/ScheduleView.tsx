'use client'
import type { Plan } from '@/lib/types'
import ScheduleBlock from './ScheduleBlock'
import OverflowList from './OverflowList'
import { useTranslations, useLanguage } from '@/lib/i18n/LanguageContext'
import { Lightbulb, ListTodo, Flame, Inbox } from 'lucide-react'

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
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
            {t('schedule.yourSchedule')}
          </p>
          <h2 style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            {new Date(plan.date + 'T12:00:00').toLocaleDateString(
              locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : 'en-US',
              { weekday: 'long', month: 'long', day: 'numeric' }
            )}
          </h2>
        </div>

        {/* Action buttons — full width on mobile */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copyAsText} style={{ ...actionBtnStyle, flex: 1 }}>
            {t('schedule.copyAsText')}
          </button>
          {onReset && (
            <button onClick={onReset} style={{ ...actionBtnStyle, flex: 1, borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              {t('schedule.newPlan')}
            </button>
          )}
        </div>
      </div>

      {/* AI Insight */}
      {plan.insight && (
        <div style={{
          padding: '12px 14px', borderRadius: 12,
          background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: 'var(--accent)', paddingTop: 2 }}><Lightbulb size={18} /></span>
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, fontStyle: 'italic' }}>
            {plan.insight}
          </p>
        </div>
      )}

      {/* Stats strip — equal thirds, scrollable on very small screens */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { label: t('schedule.blocks'), value: plan.blocks.length, emoji: <ListTodo size={22} strokeWidth={1.5} /> },
          { label: t('schedule.highPriority'), value: plan.blocks.filter(b => b.priority === 'high').length, emoji: <Flame size={22} strokeWidth={1.5} color="#f75c6a" /> },
          { label: t('schedule.overflow'), value: plan.overflow.length, emoji: <Inbox size={22} strokeWidth={1.5} /> },
        ].map(stat => (
          <div key={stat.label} className="glass" style={{
            padding: 'clamp(10px, 3vw, 14px) 8px',
            borderRadius: 10, textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, color: 'var(--muted)' }}>{stat.emoji}</div>
            <div style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 700, fontFamily: 'Syne', lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 3, lineHeight: 1.2 }}>
              {stat.label}
            </div>
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
                  padding: '2px 12px', margin: '0 0 4px 0',
                }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.4 }} />
                  <span style={{
                    fontSize: 10, color: 'var(--muted)', fontFamily: 'Syne',
                    fontWeight: 600, letterSpacing: '0.07em', whiteSpace: 'nowrap',
                    opacity: 0.6,
                  }}>
                    · {gapMin} min ·
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.4 }} />
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
  padding: '10px 14px',
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--muted)', cursor: 'pointer',
  fontSize: 13, fontWeight: 500, transition: 'color 0.15s, border-color 0.15s',
}