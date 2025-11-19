import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ColorScheme = 'blue' | 'emerald' | 'purple' | 'sky' | 'indigo' | 'orange'

interface DashboardPageWrapperProps {
  children: ReactNode
  colorScheme?: ColorScheme
  className?: string
}

const colorSchemes: Record<ColorScheme, string> = {
  blue: 'from-blue-50 to-white',
  emerald: 'from-emerald-50 to-white',
  purple: 'from-purple-50 to-white',
  sky: 'from-sky-50 to-white',
  indigo: 'from-indigo-50 to-white',
  orange: 'from-orange-50 to-white'
}

export function DashboardPageWrapper({
  children,
  colorScheme = 'blue',
  className
}: DashboardPageWrapperProps) {
  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br p-6',
      colorSchemes[colorScheme],
      className
    )}>
      {children}
    </div>
  )
}
