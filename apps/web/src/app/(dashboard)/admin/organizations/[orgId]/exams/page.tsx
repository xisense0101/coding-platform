'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardPageWrapper } from '@/components/layouts'
import { LoadingSpinner } from '@/components/common/LoadingStates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, Users, AlertTriangle, CheckCircle, Eye, ArrowLeft } from 'lucide-react'

interface OngoingExam {
  id: string
  title: string
  start_time: string
  end_time: string
  duration_minutes: number
  time_remaining: number
  created_by: string
  teacher_name: string
  active_students: number
  total_submissions: number
  violations_count: number
  is_published: boolean
}

export default function OrganizationExamsPage() {
  const params = useParams()
  const router = useRouter()
  const organizationId = params.orgId as string

  const [exams, setExams] = useState<OngoingExam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [orgName, setOrgName] = useState('')

  // Fetch organization name
  useEffect(() => {
    const fetchOrgName = async () => {
      try {
        const response = await fetch(`/api/admin/organizations/${organizationId}`)
        if (response.ok) {
          const data = await response.json()
          setOrgName(data.organization?.name || 'Organization')
        }
      } catch (error) {
        console.error('Error fetching organization:', error)
      }
    }

    fetchOrgName()
  }, [organizationId])

  // Fetch ongoing exams
  const fetchExams = async () => {
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}/exams?ongoing=true`)
      if (!response.ok) {
        throw new Error('Failed to fetch ongoing exams')
      }
      const data = await response.json()
      setExams(data.exams || [])
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to load ongoing exams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [organizationId])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchExams()
    }, 10000)

    return () => clearInterval(interval)
  }, [autoRefresh, organizationId])

  // Format time remaining
  const formatTimeRemaining = (minutes: number) => {
    if (minutes <= 0) return 'Ended'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m remaining`
    }
    return `${mins}m remaining`
  }

  // Get status badge color
  const getStatusColor = (timeRemaining: number) => {
    if (timeRemaining <= 0) return 'gray'
    if (timeRemaining <= 15) return 'red'
    if (timeRemaining <= 30) return 'yellow'
    return 'green'
  }

  if (loading) {
    return (
      <DashboardPageWrapper>
        <LoadingSpinner message="Loading ongoing exams..." />
      </DashboardPageWrapper>
    )
  }

  return (
    <DashboardPageWrapper>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Exam Monitoring - {orgName}
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor ongoing exams in real-time
          </p>
        </div>
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/organizations/${organizationId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organization
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Auto-refresh</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchExams()}
              disabled={loading}
            >
              Refresh Now
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Ongoing Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exams.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {exams.reduce((sum, exam) => sum + exam.active_students, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {exams.reduce((sum, exam) => sum + exam.total_submissions, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Violations Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {exams.reduce((sum, exam) => sum + exam.violations_count, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ongoing Exams List */}
        {exams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Ongoing Exams</h3>
              <p className="text-gray-600 text-center max-w-md">
                There are currently no exams in progress for this organization.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {exams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{exam.title}</h3>
                        <Badge
                          variant={getStatusColor(exam.time_remaining) === 'green' ? 'default' : 'destructive'}
                        >
                          {exam.time_remaining > 0 ? 'In Progress' : 'Ended'}
                        </Badge>
                        {!exam.is_published && (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Teacher: {exam.teacher_name}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/teacher/exams/${exam.id}/monitoring`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Monitor
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Time Remaining */}
                    <div className="flex items-center gap-2">
                      <Clock className={`w-5 h-5 ${
                        exam.time_remaining <= 15 ? 'text-red-500' : 
                        exam.time_remaining <= 30 ? 'text-yellow-500' : 
                        'text-green-500'
                      }`} />
                      <div>
                        <p className="text-xs text-gray-600">Time Left</p>
                        <p className="text-sm font-semibold">
                          {formatTimeRemaining(exam.time_remaining)}
                        </p>
                      </div>
                    </div>

                    {/* Active Students */}
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-600">Active</p>
                        <p className="text-sm font-semibold">{exam.active_students}</p>
                      </div>
                    </div>

                    {/* Total Submissions */}
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-600">Submissions</p>
                        <p className="text-sm font-semibold">{exam.total_submissions}</p>
                      </div>
                    </div>

                    {/* Violations */}
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-5 h-5 ${
                        exam.violations_count > 0 ? 'text-red-500' : 'text-gray-400'
                      }`} />
                      <div>
                        <p className="text-xs text-gray-600">Violations</p>
                        <p className={`text-sm font-semibold ${
                          exam.violations_count > 0 ? 'text-red-600' : ''
                        }`}>
                          {exam.violations_count}
                        </p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-600">Duration</p>
                        <p className="text-sm font-semibold">{exam.duration_minutes} min</p>
                      </div>
                    </div>
                  </div>

                  {/* Exam Times */}
                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-gray-600">
                    <span>
                      Started: {new Date(exam.start_time).toLocaleString()}
                    </span>
                    <span>
                      Ends: {new Date(exam.end_time).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardPageWrapper>
  )
}
