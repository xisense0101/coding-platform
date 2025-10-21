'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Users,
  AlertTriangle,
  Clock,
  Monitor,
  RefreshCw,
  Eye,
  Home
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import Link from 'next/link'

interface OngoingExam {
  id: string
  title: string
  slug: string
  start_time: string
  end_time: string
  duration_minutes: number
  total_marks: number
  teacher: {
    id: string
    full_name: string
    email: string
  }
  courses?: {
    id: string
    title: string
    slug: string
  }
  stats: {
    activeSubmissions: number
    completedSubmissions: number
    studentsWithViolations: number
    timeRemainingMinutes: number
  }
}

export default function AdminOngoingExamsPage() {
  const [exams, setExams] = useState<OngoingExam[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchOngoingExams()

    // Auto-refresh every 30 seconds
    if (autoRefresh) {
      const interval = setInterval(fetchOngoingExams, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchOngoingExams = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/exams/ongoing')
      if (!response.ok) throw new Error('Failed to fetch ongoing exams')

      const data = await response.json()
      setExams(data.exams || [])
    } catch (error) {
      logger.error('Error fetching ongoing exams:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Ongoing Exams</h2>
            <p className="text-muted-foreground">
              Monitor all currently active exams across your organization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
          <Button onClick={fetchOngoingExams} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exams.reduce((sum, exam) => sum + exam.stats.activeSubmissions, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exams.reduce((sum, exam) => sum + exam.stats.completedSubmissions, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {exams.reduce((sum, exam) => sum + exam.stats.studentsWithViolations, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exams List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Exams</CardTitle>
          <CardDescription>
            All exams currently in progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && exams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : exams.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No ongoing exams at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{exam.title}</h3>
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeRemaining(exam.stats.timeRemainingMinutes)} left
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Teacher: {exam.teacher.full_name}</span>
                        {exam.courses && <span>Course: {exam.courses.title}</span>}
                        <span>Duration: {exam.duration_minutes} min</span>
                        <span>Total Marks: {exam.total_marks}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Started: {new Date(exam.start_time).toLocaleString()} • 
                        Ends: {new Date(exam.end_time).toLocaleString()}
                      </div>
                    </div>
                    <Link href={`/teacher/exams/${exam.id}/monitoring`}>
                      <Button size="sm">
                        <Monitor className="h-4 w-4 mr-2" />
                        Monitor
                      </Button>
                    </Link>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Active Students</p>
                        <p className="text-sm font-semibold">{exam.stats.activeSubmissions}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Completed</p>
                        <p className="text-sm font-semibold">{exam.stats.completedSubmissions}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        exam.stats.studentsWithViolations > 0 ? 'bg-orange-100' : 'bg-gray-100'
                      }`}>
                        <AlertTriangle className={`h-4 w-4 ${
                          exam.stats.studentsWithViolations > 0 ? 'text-orange-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Violations</p>
                        <p className={`text-sm font-semibold ${
                          exam.stats.studentsWithViolations > 0 ? 'text-orange-600' : ''
                        }`}>
                          {exam.stats.studentsWithViolations}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
