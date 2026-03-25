interface Props {
  tasks: string[]
  /** Optional: show compact inline style instead of full card */
  compact?: boolean
}

export default function OverflowList({ tasks, compact = false }: Props) {
  if (!tasks || tasks.length === 0) return null

  if (compact) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {tasks.map((task, i) => (
          <span key={i} style={{
            fontSize: 12, padding: '3px 10px', borderRadius: 12,
            background: 'rgba(136,136,160,0.12)', border: '1px solid rgba(136,136,160,0.2)',
            color: 'var(--muted)',
          }}>
            {task}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div style={{
      padding: '20px',
      background: 'rgba(247,199,106,0.04)',
      border: '1px solid rgba(247,199,106,0.2)',
      borderRadius: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>📤</span>
        <div>
          <h3 style={{
            fontFamily: 'Syne', fontSize: 13, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: '#f7c76a',
          }}>
            Didn&apos;t fit today
          </h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} pushed to tomorrow
          </p>
        </div>
      </div>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map((task, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 7,
              border: '1px solid var(--border)',
            }}
          >
            <span style={{
              marginTop: 2, display: 'inline-block',
              width: 14, height: 14, borderRadius: '50%',
              border: '1.5px solid var(--muted)',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
              {task}
            </span>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <p style={{ marginTop: 14, fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>💡</span>
        Add these to tomorrow&apos;s brain dump to carry them forward.
      </p>
    </div>
  )
}