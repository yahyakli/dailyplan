import { 
  Rocket, Flame, Zap, Dumbbell, Gem, Target, Trophy, Medal, 
  Crown, Sparkles, Star, Sunrise, Moon, Brain, Palette, Calendar, Pin 
} from 'lucide-react'

const ICON_MAP: Record<string, any> = {
  Rocket, Flame, Zap, Dumbbell, Gem, Target, Trophy, Medal, 
  Crown, Sparkles, Star, Sunrise, Moon, Brain, Palette, Calendar
}

export default function BadgeIcon({ 
  name, size = 24, className = '', color, strokeWidth = 2 
}: { 
  name: string, size?: number, className?: string, color?: string, strokeWidth?: number 
}) {
  const Icon = ICON_MAP[name] || Pin
  return <Icon size={size} className={className} color={color} strokeWidth={strokeWidth} />
}
