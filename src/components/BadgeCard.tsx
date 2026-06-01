'use client'
import type { Badge } from '@/lib/types'
import BadgeIcon from './BadgeIcon'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface BadgeCardProps {
  badge: Badge
  unlocked?: boolean
  unlockedAt?: string
  progress?: { current: number; target: number; percentage: number }
}

export default function BadgeCard({ badge, unlocked = false, unlockedAt, progress }: BadgeCardProps) {
  const t = useTranslations()
  const showProgress = !unlocked && progress && progress.target > 1 && progress.current > 0

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 overflow-hidden rounded-xl border p-4 transition-all duration-250 ease-in-out cursor-default",
        unlocked 
          ? "badge-card-unlocked bg-primary/5 border-primary/20 opacity-100 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10" 
          : "badge-card-locked bg-muted border-border opacity-60 hover:-translate-y-0.5 hover:shadow-md hover:shadow-foreground/5"
      )}
    >
      {/* Emoji / Icon */}
      <div className={cn(
        "flex shrink-0 items-center justify-center transition-all duration-300",
        unlocked ? "text-primary opacity-100" : "text-muted-foreground grayscale opacity-60"
      )}>
        <BadgeIcon name={badge.iconName} size={28} strokeWidth={2} />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-heading text-[13px] font-semibold mb-0.5",
          unlocked ? "text-foreground" : "text-muted-foreground"
        )}>
          {badge.label}
        </div>
        <div className="text-xs text-muted-foreground line-clamp-2">
          {badge.description}
        </div>

        {/* Progress bar for locked badges */}
        {showProgress && (
          <div className="mt-2 flex items-center gap-2">
            <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-border">
              <div 
                className="progress-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-600 ease-in-out" 
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span className="font-heading text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
              {progress.current}/{progress.target}
            </span>
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div className="ml-auto shrink-0 text-right">
        {unlocked ? (
          <div>
            <div className="font-heading text-[10px] font-semibold text-primary uppercase tracking-wider">
              ✓ {t('badges.unlocked')}
            </div>
            {unlockedAt && (
              <div className="mt-0.5 text-[9px] text-muted-foreground">
                {new Date(unlockedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background">
            <BadgeIcon name="Lock" size={12} strokeWidth={2.5} className="text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  )
}