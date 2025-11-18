import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  className?: string
  variant?: 'default' | 'dashed'
}

export function EmptyState({ 
  icon: Icon,
  title, 
  description, 
  action,
  className,
  variant = 'dashed'
}: EmptyStateProps) {
  const ActionIcon = action?.icon

  return (
    <Card className={cn(
      variant === 'dashed' ? 'border-dashed border-gray-300' : '',
      className
    )}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {Icon && <Icon className="h-16 w-16 text-gray-300 mb-4" />}
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 mb-4 text-center max-w-md">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick}>
            {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
