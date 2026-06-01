import { Trophy, Medal, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Podium({ entries }: { entries: any[] }) {
  const topThree = entries.slice(0, 3)
  if (topThree.length === 0) return null

  return (
    <div className="flex justify-center items-end gap-2 pb-8 pt-4">
      {topThree.length >= 2 && (
        <PodiumSpot entry={topThree[1]} rank={2} icon={Medal} color="text-slate-400" />
      )}
      <PodiumSpot entry={topThree[0]} rank={1} icon={Trophy} color="text-amber-400" />
      {topThree.length >= 3 && (
        <PodiumSpot entry={topThree[2]} rank={3} icon={Award} color="text-amber-700" />
      )}
    </div>
  )
}

function PodiumSpot({ entry, rank, icon: Icon, color }: { entry: any, rank: number, icon: any, color: string }) {
  return (
    <div className={cn("flex flex-col items-center", rank === 1 ? "pb-4" : "")}>
      <div className="relative mb-2">
        {entry.image ? (
          <img src={entry.image} alt={entry.name} className="w-12 h-12 rounded-full border-2 border-background" />
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-background bg-primary flex items-center justify-center text-white font-bold text-lg">
            {entry.name[0]}
          </div>
        )}
        <Icon size={20} className={cn("absolute -top-2 -right-2", color)} />
      </div>
      <div className={cn("bg-muted/50 rounded-t-lg p-3 text-center flex flex-col items-center", rank === 1 ? "h-24" : "h-16")}>
        <span className="font-heading font-bold text-sm truncate w-20">{entry.name}</span>
        <span className="font-heading font-bold text-primary">{entry.points}</span>
      </div>
    </div>
  )
}
