import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type ColorVariant = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan' | 'indigo'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  badges: string[]
  colorVariant?: ColorVariant
  variant?: 'security' | 'feature'
  className?: string
}

const colorConfig: Record<ColorVariant, {
  card: string
  icon: string
  badge: string
  border: string
}> = {
  blue: {
    card: 'bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900',
    icon: 'from-blue-500 to-blue-600',
    badge: 'border-blue-300',
    border: 'hover:border-blue-500'
  },
  purple: {
    card: 'bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-900',
    icon: 'from-purple-500 to-purple-600',
    badge: 'border-purple-300',
    border: 'hover:border-purple-500'
  },
  green: {
    card: 'bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-slate-900',
    icon: 'from-green-500 to-green-600',
    badge: 'border-green-300',
    border: 'hover:border-green-500'
  },
  orange: {
    card: 'bg-gradient-to-br from-white to-orange-50 dark:from-slate-800 dark:to-slate-900',
    icon: 'from-orange-500 to-orange-600',
    badge: 'border-orange-300',
    border: 'hover:border-orange-500'
  },
  red: {
    card: 'bg-gradient-to-br from-white to-red-50 dark:from-slate-800 dark:to-slate-900',
    icon: 'from-red-500 to-red-600',
    badge: 'border-red-300',
    border: 'hover:border-red-500'
  },
  cyan: {
    card: 'bg-gradient-to-br from-white to-cyan-50 dark:from-slate-800 dark:to-slate-900',
    icon: 'from-cyan-500 to-cyan-600',
    badge: 'border-cyan-300',
    border: 'hover:border-cyan-500'
  },
  indigo: {
    card: 'bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-slate-900',
    icon: 'from-indigo-500 to-indigo-600',
    badge: 'border-indigo-300',
    border: 'hover:border-indigo-500'
  }
}

const securityColorConfig: Record<ColorVariant, {
  card: string
  icon: string
  badge: string
  border: string
}> = {
  blue: {
    card: 'bg-white dark:bg-slate-800',
    icon: 'from-blue-500 to-blue-600',
    badge: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'hover:border-blue-500'
  },
  purple: {
    card: 'bg-white dark:bg-slate-800',
    icon: 'from-purple-500 to-purple-600',
    badge: 'bg-purple-50 dark:bg-purple-900/30',
    border: 'hover:border-purple-500'
  },
  green: {
    card: 'bg-white dark:bg-slate-800',
    icon: 'from-green-500 to-green-600',
    badge: 'bg-green-50 dark:bg-green-900/30',
    border: 'hover:border-green-500'
  },
  orange: {
    card: 'bg-white dark:bg-slate-800',
    icon: 'from-orange-500 to-orange-600',
    badge: 'bg-orange-50 dark:bg-orange-900/30',
    border: 'hover:border-orange-500'
  },
  red: {
    card: 'bg-white dark:bg-slate-800',
    icon: 'from-red-500 to-red-600',
    badge: 'bg-red-50 dark:bg-red-900/30',
    border: 'hover:border-red-500'
  },
  cyan: {
    card: 'bg-white dark:bg-slate-800',
    icon: 'from-cyan-500 to-cyan-600',
    badge: 'bg-cyan-50 dark:bg-cyan-900/30',
    border: 'hover:border-cyan-500'
  },
  indigo: {
    card: 'bg-white dark:bg-slate-800',
    icon: 'from-indigo-500 to-indigo-600',
    badge: 'bg-indigo-50 dark:bg-indigo-900/30',
    border: 'hover:border-indigo-500'
  }
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  badges,
  colorVariant = 'blue',
  variant = 'feature',
  className
}: FeatureCardProps) {
  const config = variant === 'security' ? securityColorConfig[colorVariant] : colorConfig[colorVariant]

  return (
    <Card 
      className={cn(
        'group hover:shadow-2xl transition-all duration-300 border-2 overflow-hidden relative',
        variant === 'feature' ? 'hover:-translate-y-2' : '',
        config.card,
        config.border,
        className
      )}
    >
      {variant === 'security' && (
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity',
          `from-${colorVariant}-500/5 to-transparent`
        )}></div>
      )}
      
      <CardHeader className={variant === 'security' ? 'relative' : ''}>
        <div className={cn(
          'flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg',
          variant === 'security' ? 'w-16 h-16 rounded-2xl' : 'w-14 h-14 rounded-xl',
          'bg-gradient-to-br',
          config.icon
        )}>
          <Icon className={cn('text-white', variant === 'security' ? 'h-8 w-8' : 'h-7 w-7')} />
        </div>
        <CardTitle className={variant === 'security' ? 'text-xl font-bold' : 'text-xl'}>
          {title}
        </CardTitle>
        <CardDescription className="text-base">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, index) => (
            <Badge 
              key={index}
              variant={variant === 'security' ? 'secondary' : 'outline'}
              className={config.badge}
            >
              {badge}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
