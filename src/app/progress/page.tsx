'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations, useLanguage } from '@/lib/i18n/LanguageContext'
import {
  TrendingUp,
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  Circle,
  PlayCircle,
  SkipForward,
  BarChart3,
  Award,
} from 'lucide-react'

interface ProgressStats {
  totalPlans: number
  completedPlans: number
  totalBlocks: number
  completedBlocks: number
  completionRate: number
  averageBlocksPerPlan: number
  categoryBreakdown: Record<
    string,
    { total: number; completed: number; rate: number }
  >
  weeklyProgress: Array<{
    date: string
    completed: number
    total: number
    rate: number
  }>
  streak: {
    current: number
    longest: number
  }
}

export default function ProgressPage() {
  const { data: session, status } = useSession()
  const { locale } = useLanguage()
  const t = useTranslations()
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'authenticated') {
      loadStats()
    }
  }, [status])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/progress/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      } else {
        setError('Failed to load progress statistics')
      }
    } catch (err) {
      setError('Failed to load progress statistics')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>Loading your progress...</div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div style={containerStyle}>
        <div style={unauthenticatedStyle}>
          <Target size={48} color="var(--accent)" style={{ marginBottom: 16 }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Sign in to view your progress</h1>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
            Track your productivity, completion rates, and streaks
          </p>
          <a href="/auth/signin" style={signInButtonStyle}>Sign In</a>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={errorStyle}>{error}</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={containerStyle}>
        <div style={emptyStyle}>
          <BarChart3 size={48} color="var(--muted)" style={{ marginBottom: 16 }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>No Data Yet</h1>
          <p style={{ color: 'var(--muted)' }}>
            Create and complete plans to see your progress analytics
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1
            style={{
              fontSize: 'clamp(24px, 6vw, 32px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: 4,
            }}
          >
            Progress Dashboard
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Track your productivity and completion patterns
          </p>
        </div>
        <button onClick={loadStats} style={refreshButtonStyle} title="Refresh stats">
          <BarChart3 size={20} />
        </button>
      </div>

      {/* Streak Card */}
      <div style={streakCardStyle}>
        <div style={streakItemStyle}>
          <div style={streakIconStyle}>
            <TrendingUp size={24} color="#f7936a" />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f7936a' }}>{stats.streak.current}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Current Streak</div>
          </div>
        </div>
        <div style={{ ...streakItemStyle, borderLeft: '1px solid var(--border)' }}>
          <div style={streakIconStyle}>
            <Award size={24} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{stats.streak.longest}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Longest Streak</div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={statsGridStyle}>
        <StatCard
          icon={<Calendar size={20} color="var(--accent)" />}
          label="Total Plans"
          value={stats.totalPlans}
          sublabel={`${stats.completedPlans} completed`}
        />
        <StatCard
          icon={<CheckCircle2 size={20} color="#4ade80" />}
          label="Completion Rate"
          value={`${stats.completionRate.toFixed(0)}%`}
          sublabel={`${stats.completedBlocks}/${stats.totalBlocks} tasks`}
        />
        <StatCard
          icon={<Target size={20} color="#f7936a" />}
          label="Avg Tasks/Plan"
          value={stats.averageBlocksPerPlan.toFixed(1)}
          sublabel="tasks per plan"
        />
        <StatCard
          icon={<Clock size={20} color="#0fa8d8" />}
          label="Est. Time Logged"
          value={`${(stats.totalBlocks * 45) / 60}h`}
          sublabel="based on avg 45min/task"
        />
      </div>

      {/* Category Breakdown */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Category Performance</h2>
        <div style={categoryGridStyle}>
          {Object.entries(stats.categoryBreakdown).map(([category, data]) => (
            <CategoryCard
              key={category}
              category={category}
              total={data.total}
              completed={data.completed}
              rate={data.rate}
            />
          ))}
        </div>
      </div>

      {/* Weekly Progress */}
      {stats.weeklyProgress.length > 0 && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Last 7 Days</h2>
          <div style={weeklyChartStyle}>
            {stats.weeklyProgress.map((day, idx) => (
              <DayBar
                key={day.date}
                date={day.date}
                completed={day.completed}
                total={day.total}
                rate={day.rate}
                isToday={idx === stats.weeklyProgress.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Status Legend */}
      <div style={legendStyle}>
        <div style={legendItemStyle}>
          <Circle size={14} color="var(--muted)" />
          <span>Pending</span>
        </div>
        <div style={legendItemStyle}>
          <PlayCircle size={14} color="var(--accent)" />
          <span>In Progress</span>
        </div>
        <div style={legendItemStyle}>
          <CheckCircle2 size={14} color="#4ade80" />
          <span>Completed</span>
        </div>
        <div style={legendItemStyle}>
          <SkipForward size={14} color="var(--muted)" />
          <span>Skipped</span>
        </div>
      </div>
    </div>
  )
}

// Sub-components

function StatCard({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sublabel: string
}) {
  return (
    <div style={statCardStyle}>
      <div style={{ marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.7 }}>{sublabel}</div>
    </div>
  )
}

function CategoryCard({
  category,
  total,
  completed,
  rate,
}: {
  category: string
  total: number
  completed: number
  rate: number
}) {
  const categoryColors: Record<string, string> = {
    'deep-work': 'var(--accent)',
    communication: '#0fa8d8',
    admin: '#8888a0',
    personal: 'var(--accent-2)',
    break: '#f7be46',
  }

  const categoryLabels: Record<string, string> = {
    'deep-work': 'Deep Work',
    communication: 'Communication',
    admin: 'Admin',
    personal: 'Personal',
    break: 'Break',
  }

  const color = categoryColors[category] || 'var(--muted)'
  const label = categoryLabels[category] || category

  return (
    <div style={categoryCardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {completed}/{total}
        </span>
      </div>

      <div
        style={{
          height: 6,
          background: 'var(--border)',
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${rate}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{rate.toFixed(0)}% completion rate</div>
    </div>
  )
}

function DayBar({
  date,
  completed,
  total,
  rate,
  isToday,
}: {
  date: string
  completed: number
  total: number
  rate: number
  isToday: boolean
}) {
  const dayName = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: '100%',
          height: 120,
          background: 'var(--surface)',
          borderRadius: 8,
          position: 'relative',
          overflow: 'hidden',
          border: isToday ? '2px solid var(--accent)' : '1px solid var(--border)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${rate}%`,
            background: isToday
              ? 'linear-gradient(to top, var(--accent), #9b8af7)'
              : 'var(--muted)',
            opacity: isToday ? 1 : 0.5,
            transition: 'height 0.3s ease',
          }}
        />

        {total > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 10,
              fontWeight: 600,
              color: isToday ? '#fff' : 'var(--text)',
            }}
          >
            {completed}/{total}
          </div>
        )}
      </div>

      <span
        style={{
          fontSize: 11,
          color: isToday ? 'var(--accent)' : 'var(--muted)',
          fontWeight: isToday ? 600 : 400,
        }}
      >
        {dayName}
      </span>
    </div>
  )
}

// Styles

const containerStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: 'clamp(20px, 5vw, 40px) clamp(16px, 4vw, 32px)',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 24,
}

const refreshButtonStyle: React.CSSProperties = {
  padding: '10px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: 'var(--muted)',
  cursor: 'pointer',
  transition: 'all 0.15s',
}

const loadingStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px',
  color: 'var(--muted)',
}

const unauthenticatedStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px',
}

const signInButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '12px 24px',
  background: 'var(--accent)',
  color: '#fff',
  borderRadius: 10,
  textDecoration: 'none',
  fontWeight: 600,
}

const errorStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 20px',
  color: '#f75c6a',
}

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px',
}

const streakCardStyle: React.CSSProperties = {
  display: 'flex',
  background: 'var(--surface)',
  borderRadius: 12,
  padding: 20,
  marginBottom: 24,
  border: '1px solid var(--border)',
}

const streakItemStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 16,
}

const streakIconStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  background: 'var(--bg)',
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 12,
  marginBottom: 24,
}

const statCardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 12,
  padding: 16,
  border: '1px solid var(--border)',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 24,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 12,
  fontFamily: 'Syne',
}

const categoryGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
}

const categoryCardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 10,
  padding: 14,
  border: '1px solid var(--border)',
}

const weeklyChartStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  background: 'var(--surface)',
  borderRadius: 12,
  padding: 16,
  border: '1px solid var(--border)',
}

const legendStyle: React.CSSProperties = {
  display: 'flex',
  gap: 24,
  justifyContent: 'center',
  padding: '16px',
  background: 'var(--surface)',
  borderRadius: 10,
  border: '1px solid var(--border)',
}

const legendItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  color: 'var(--muted)',
}
