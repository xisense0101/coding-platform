import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ColorScheme = 'blue' | 'emerald' | 'purple' | 'sky' | 'indigo' | 'orange'

interface DashboardPageWrapperProps {
  children: ReactNode
  colorScheme?: ColorScheme
  className?: string
}

const colorSchemes: Record<ColorScheme, string> = {
  blue: 'from-blue-50 to-white dark:from-blue-950/20 dark:to-background',
  emerald: 'from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background',
  purple: 'from-purple-50 to-white dark:from-purple-950/20 dark:to-background',
  sky: 'from-sky-50 to-white dark:from-sky-950/20 dark:to-background',
  indigo: 'from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background',
  orange: 'from-orange-50 to-white dark:from-orange-950/20 dark:to-background'
}

export function DashboardPageWrapper({
  children,
  colorScheme = 'blue',
  className
}: DashboardPageWrapperProps) {
  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br p-4 sm:p-6 lg:p-8',
      colorSchemes[colorScheme],
      className
    )}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <main id="main-content" className="focus:outline-none" tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
