'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { TrendingUp, Calendar, CheckCircle2, Target, BarChart3 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

interface ProgressStats {
  totalPlans: number
  completedPlans: number
  totalBlocks: number
  completedBlocks: number
  completionRate: number
  averageBlocksPerPlan: number
  categoryBreakdown: Record<string, { total: number; completed: number; rate: number }>
  weeklyProgress: Array<{ date: string; completed: number; total: number; rate: number }>
  streak: { current: number; longest: number }
}

export default function ProgressPage() {
  const { status } = useSession()
  const t = useTranslations()
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/progress/stats')
        .then(res => res.json())
        .then(setStats)
        .finally(() => setLoading(false))
    }
  }, [status])

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  if (!stats) return <div className="p-8 text-center text-muted-foreground">No data found.</div>

  const pieData = Object.entries(stats.categoryBreakdown).map(([name, data]) => ({
    name, value: data.total
  }))
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#64748b', '#ec4899']

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 fade-up">
      <h1 className="text-3xl font-bold font-heading">Progress Analytics</h1>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPITile label="Total Plans" value={stats.totalPlans} icon={<Calendar className="text-primary" />} />
        <KPITile label="Completion Rate" value={`${stats.completionRate}%`} icon={<CheckCircle2 className="text-emerald-500" />} />
        <KPITile label="Current Streak" value={stats.streak.current} icon={<TrendingUp className="text-orange-500" />} />
        <KPITile label="Total Tasks" value={stats.totalBlocks} icon={<Target className="text-indigo-500" />} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="bg-muted/30 p-6 rounded-xl border">
          <h2 className="text-lg font-bold mb-4">Weekly Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weeklyProgress}>
                <XAxis dataKey="date" tick={{fontSize: 10}} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie */}
        <div className="bg-muted/30 p-6 rounded-xl border">
          <h2 className="text-lg font-bold mb-4">Category Breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} dataKey="value">
                  {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="bg-muted/30 p-6 rounded-xl border">
        <h2 className="text-lg font-bold mb-4">Activity Heatmap (Last 28 Days)</h2>
        <div className="grid grid-cols-7 gap-1">
            {stats.weeklyProgress.concat(stats.weeklyProgress).concat(stats.weeklyProgress).concat(stats.weeklyProgress).slice(0, 28).map((day, i) => (
                <div key={i} className={cn("h-8 rounded-sm", 
                    day.rate === 0 ? 'bg-muted' :
                    day.rate < 50 ? 'bg-indigo-300' :
                    day.rate < 90 ? 'bg-indigo-500' : 'bg-indigo-700'
                )} title={`${day.date}: ${day.rate}%`} />
            ))}
        </div>
      </div>
    </div>
  )
}

function KPITile({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-muted/30 p-4 rounded-xl border flex items-center gap-4">
      <div className="p-2 bg-background rounded-lg">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground uppercase">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  )
}
