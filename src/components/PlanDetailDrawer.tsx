'use client'
import { Plan } from '@/lib/types'
import { X, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

interface Props {
  plan: Plan
  onClose: () => void
}

export default function PlanDetailDrawer({ plan, onClose }: Props) {
  const router = useRouter()
  const t = useTranslations()

  const handleRecreate = () => {
    localStorage.setItem('dailyplan:draft:tasks', plan.braindump)
    router.push('/plan')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background border-l p-6 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-heading">{plan.title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          <div>
            <Label className="text-xs text-muted-foreground uppercase">{t('history.tasks')}</Label>
            <div className="mt-2 space-y-2">
              {plan.tasks.map((task, i) => (
                <div key={i} className="p-3 bg-muted/50 rounded-lg text-sm border">
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t mt-auto">
          <Button className="w-full h-12 gap-2" onClick={handleRecreate}>
            <RefreshCw size={18} /> {t('history.recreate')}
          </Button>
        </div>
      </div>
    </div>
  )
}
