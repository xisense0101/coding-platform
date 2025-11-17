'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

export interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo'
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  color = 'blue',
  className,
}: StatsCardProps) {
  const colorConfig = {
    blue: {
      gradient: 'from-blue-50 to-white',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
    },
    green: {
      gradient: 'from-green-50 to-white',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      iconText: 'text-green-600',
    },
    purple: {
      gradient: 'from-purple-50 to-white',
      border: 'border-purple-200',
      iconBg: 'bg-purple-100',
      iconText: 'text-purple-600',
    },
    orange: {
      gradient: 'from-orange-50 to-white',
      border: 'border-orange-200',
      iconBg: 'bg-orange-100',
      iconText: 'text-orange-600',
    },
    red: {
      gradient: 'from-red-50 to-white',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconText: 'text-red-600',
    },
    indigo: {
      gradient: 'from-indigo-50 to-white',
      border: 'border-indigo-200',
      iconBg: 'bg-indigo-100',
      iconText: 'text-indigo-600',
    },
  }

  const config = colorConfig[color]

  return (
    <Card
      className={cn(
        'bg-gradient-to-br transition-shadow hover:shadow-md',
        config.gradient,
        config.border,
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 leading-none">
          {title}
        </CardTitle>
        {icon && (
          <div className={cn('p-1.5 sm:p-2 rounded-full', config.iconBg, config.iconText)}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          {value}
        </div>
        {description && (
          <p className="text-xs text-gray-600 leading-tight">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2 sm:mt-3">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-red-600" />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-gray-500 ml-1">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
