import { Button } from '@/components/ui/button'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string | ReactNode
  description?: string | ReactNode
  actions?: ReactNode[]
  className?: string
}

export function PageHeader({ 
  title, 
  description, 
  actions,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn('flex justify-between items-center mb-8', className)}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-gray-600">
            {description}
          </p>
        )}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex items-center space-x-3">
          {actions.map((action, index) => (
            <div key={index}>{action}</div>
          ))}
        </div>
      )}
    </div>
  )
}
