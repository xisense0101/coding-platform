'use client'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Clock, CheckCircle, Lock, Star, Users, Play, Eye, BookOpen } from 'lucide-react'
import Link from 'next/link'

export interface CourseCardProps {
  id: string
  title: string
  description?: string
  progress?: number
  score?: number
  status: 'active' | 'completed' | 'locked'
  nextDeadline?: string
  instructor?: string
  studentCount?: number
  totalLessons?: number
  completedLessons?: number
  thumbnail?: string
  isTeacher?: boolean
  onClick?: () => void
  onEdit?: () => void
  className?: string
}

export function CourseCard({
  id,
  title,
  description,
  progress = 0,
  score,
  status,
  nextDeadline,
  instructor,
  studentCount,
  totalLessons,
  completedLessons,
  thumbnail,
  isTeacher = false,
  onClick,
  onEdit,
  className
}: CourseCardProps) {
  const statusConfig = {
    active: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Clock className="h-3 w-3 sm:h-4 sm:w-4" />,
      buttonText: 'Continue',
    },
    completed: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />,
      buttonText: 'Review',
    },
    locked: {
      color: 'bg-gray-100 text-gray-600 border-gray-200',
      icon: <Lock className="h-3 w-3 sm:h-4 sm:w-4" />,
      buttonText: 'Locked',
    },
  }

  const config = statusConfig[status]

  return (
    <Card
      className={cn(
        'border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-all duration-200',
        'w-full', // Full width on mobile
        status === 'locked' && 'opacity-60',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {thumbnail && (
        <div className="relative h-32 sm:h-40 md:h-48 w-full overflow-hidden rounded-t-lg">
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-2">
              {title}
            </CardTitle>
            {description && (
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{description}</p>
            )}
          </div>
          <Badge className={cn('ml-2 flex items-center gap-1 shrink-0 text-xs', config.color)}>
            {config.icon}
            <span className="hidden sm:inline">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-4 sm:px-6 pb-4 space-y-3">
        {/* Instructor */}
        {instructor && (
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
            <span className="truncate">{instructor}</span>
          </div>
        )}

        {/* Progress */}
        {progress > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5 sm:h-2" />
            {completedLessons !== undefined && totalLessons !== undefined && (
              <p className="text-xs text-gray-500 mt-1">
                {completedLessons} of {totalLessons} lessons completed
              </p>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 flex-wrap">
          {score !== undefined && (
            <div className="flex items-center">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-yellow-500" />
              <span>{score}%</span>
            </div>
          )}

          {studentCount !== undefined && isTeacher && (
            <div className="flex items-center">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span>{studentCount} {studentCount === 1 ? 'student' : 'students'}</span>
            </div>
          )}
        </div>

        {/* Next Deadline */}
        {nextDeadline && (
          <div className="text-xs sm:text-sm text-orange-600 font-medium">
            {nextDeadline}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
            disabled={status === 'locked'}
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
          >
            <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
            {config.buttonText}
          </Button>

          {isTeacher && onEdit && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 sm:h-9 px-2 sm:px-3"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
