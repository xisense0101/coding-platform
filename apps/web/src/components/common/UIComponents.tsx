'use client'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  BookOpen, 
  Clock, 
  Users, 
  Trophy, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Code,
  PenTool,
  Eye,
  Play,
  Lock,
  Star
} from 'lucide-react'

// Stat Card Component
interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  className?: string
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  color = 'blue',
  className 
}: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-50 to-white border-blue-200',
    green: 'from-green-50 to-white border-green-200',
    purple: 'from-purple-50 to-white border-purple-200',
    orange: 'from-orange-50 to-white border-orange-200',
    red: 'from-red-50 to-white border-red-200'
  }

  return (
    <Card className={cn(`bg-gradient-to-br ${colorClasses[color]}`, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {icon && (
          <div className={`p-2 rounded-full bg-${color}-100`}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {value}
        </div>
        {description && (
          <p className="text-xs text-gray-600 mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp 
              className={cn(
                "h-3 w-3 mr-1",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )} 
            />
            <span className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Course Card Component
interface CourseCardProps {
  id: string
  title: string
  description?: string
  progress?: number
  score?: number
  status: 'active' | 'completed' | 'locked'
  nextDeadline?: string
  studentCount?: number
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
  studentCount,
  isTeacher = false,
  onClick,
  onEdit,
  className
}: CourseCardProps) {
  const statusColors = {
    active: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    locked: 'bg-gray-100 text-gray-600 border-gray-200'
  }

  const statusIcons = {
    active: <Clock className="h-4 w-4" />,
    completed: <CheckCircle className="h-4 w-4" />,
    locked: <Lock className="h-4 w-4" />
  }

  return (
    <Card 
      className={cn(
        "border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-shadow cursor-pointer",
        status === 'locked' && "opacity-60",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-gray-600 mb-3">{description}</p>
            )}
          </div>
          <Badge className={cn("ml-2 flex items-center gap-1", statusColors[status])}>
            {statusIcons[status]}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Progress */}
        {progress > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          {score && (
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-1 text-yellow-500" />
              <span>Score: {score}%</span>
            </div>
          )}
          
          {studentCount && isTeacher && (
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{studentCount} students</span>
            </div>
          )}
        </div>

        {/* Next Deadline */}
        {nextDeadline && (
          <div className="text-sm text-orange-600 font-medium mb-4">
            Next: {nextDeadline}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            className="flex-1"
            disabled={status === 'locked'}
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
          >
            <Play className="h-4 w-4 mr-2" />
            {status === 'completed' ? 'Review' : 'Continue'}
          </Button>
          
          {isTeacher && onEdit && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Question Type Icon Component
export function QuestionTypeIcon({ type, className }: { type: string; className?: string }) {
  const icons = {
    mcq: <CheckCircle className={cn("h-4 w-4", className)} />,
    coding: <Code className={cn("h-4 w-4", className)} />,
    manual: <PenTool className={cn("h-4 w-4", className)} />,
    reading: <FileText className={cn("h-4 w-4", className)} />,
    mq: <PenTool className={cn("h-4 w-4", className)} />
  }

  return icons[type as keyof typeof icons] || <FileText className={cn("h-4 w-4", className)} />
}

// Question Type Color Component
export function getQuestionTypeColor(type: string): string {
  const colors = {
    mcq: 'bg-green-100 text-green-700 border-green-200',
    coding: 'bg-purple-100 text-purple-700 border-purple-200',
    manual: 'bg-orange-100 text-orange-700 border-orange-200',
    reading: 'bg-blue-100 text-blue-700 border-blue-200',
    mq: 'bg-orange-100 text-orange-700 border-orange-200'
  }

  return colors[type as keyof typeof colors] || 'bg-sky-100 text-sky-700 border-sky-200'
}

// Activity Item Component
interface ActivityItemProps {
  type: 'assignment' | 'quiz' | 'course' | 'grade' | 'exam' | 'student'
  message: string
  time: string
  className?: string
}

export function ActivityItem({ type, message, time, className }: ActivityItemProps) {
  const typeConfig = {
    assignment: { 
      icon: <FileText className="h-4 w-4" />, 
      color: 'bg-blue-100 text-blue-600' 
    },
    quiz: { 
      icon: <CheckCircle className="h-4 w-4" />, 
      color: 'bg-green-100 text-green-600' 
    },
    course: { 
      icon: <BookOpen className="h-4 w-4" />, 
      color: 'bg-purple-100 text-purple-600' 
    },
    grade: { 
      icon: <Star className="h-4 w-4" />, 
      color: 'bg-yellow-100 text-yellow-600' 
    },
    exam: { 
      icon: <Trophy className="h-4 w-4" />, 
      color: 'bg-orange-100 text-orange-600' 
    },
    student: { 
      icon: <Users className="h-4 w-4" />, 
      color: 'bg-indigo-100 text-indigo-600' 
    }
  }

  const config = typeConfig[type] || typeConfig.course

  return (
    <div className={cn("flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200", className)}>
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", config.color)}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{message}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  )
}

// Loading Skeleton Components
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
      </CardContent>
    </Card>
  )
}

export function CourseCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-3 animate-pulse"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-2 bg-gray-200 rounded w-full mb-4 animate-pulse"></div>
        <div className="flex justify-between">
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  )
}
