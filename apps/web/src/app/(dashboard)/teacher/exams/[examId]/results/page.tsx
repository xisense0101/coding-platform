'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Eye,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Submission {
  id: string
  student_id: string | null
  student_name: string
  student_email: string
  roll_number: string
  student_section: string
  attempt_number: number
  started_at: string
  submitted_at: string | null
  time_taken_minutes: number
  auto_submitted: boolean
  total_score: number
  max_score: number
  percentage: number
  is_passed: boolean
  submission_status: string
  is_submitted: boolean
  answers: Record<string, any>
  ip_address: string
  created_at: string
}

interface Stats {
  totalSubmissions: number
  completedSubmissions: number
  inProgressSubmissions: number
  averageScore: number
  averagePercentage: number
  passedCount: number
  failedCount: number
  autoSubmittedCount: number
}

export default function ExamResultsPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params?.examId as string

  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<any>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  useEffect(() => {
    if (examId) {
      fetchResults()
    }
  }, [examId])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/exams/${examId}/results`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch results')
      }

      const data = await response.json()
      
      if (data.success) {
        setExam(data.exam)
        setSubmissions(data.submissions)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching results:', error)
      alert('Failed to load exam results')
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewSubmission = (submission: Submission) => {
    // Store submission data in sessionStorage
    sessionStorage.setItem('previewSubmission', JSON.stringify(submission))
    sessionStorage.setItem('previewExamId', examId)
    
    // Open preview in new tab
    window.open(`/teacher/exams/${examId}/preview-submission/${submission.id}`, '_blank')
  }

  const exportToCSV = () => {
    const headers = [
      'Roll Number',
      'Name',
      'Email',
      'Section',
      'Submitted At',
      'Time Taken (min)',
      'Score',
      'Max Score',
      'Percentage',
      'Status',
      'Auto Submitted',
      'IP Address'
    ]

    const rows = submissions
      .filter(s => s.is_submitted)
      .map(s => [
        s.roll_number || 'N/A',
        s.student_name,
        s.student_email,
        s.student_section || 'N/A',
        s.submitted_at ? new Date(s.submitted_at).toLocaleString() : 'N/A',
        s.time_taken_minutes || 0,
        s.total_score || 0,
        s.max_score || 0,
        s.percentage?.toFixed(2) || 0,
        s.is_passed ? 'Passed' : 'Failed',
        s.auto_submitted ? 'Yes' : 'No',
        s.ip_address || 'N/A'
      ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `exam-results-${examId}-${new Date().toISOString()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusBadge = (submission: Submission) => {
    if (!submission.is_submitted) {
      return <Badge variant="secondary">In Progress</Badge>
    }
    if (submission.auto_submitted) {
      return <Badge variant="destructive" className="bg-orange-500">Auto Submitted</Badge>
    }
    if (submission.is_passed) {
      return <Badge variant="default" className="bg-green-600">Passed</Badge>
    }
    return <Badge variant="destructive">Failed</Badge>
  }

  const calculateAttemptedQuestions = (answers: Record<string, any>) => {
    if (!answers) return 0
    return Object.keys(answers).length
  }

  const calculateCorrectAnswers = (answers: Record<string, any>) => {
    if (!answers) return 0
    return Object.values(answers).filter((ans: any) => ans.is_correct).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/teacher/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{exam?.title}</h1>
            <p className="text-gray-600 mt-1">Exam Results & Analytics</p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.inProgressSubmissions} in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageScore.toFixed(1)} / {exam?.totalMarks || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.averagePercentage.toFixed(1)}% average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.passedCount}</div>
              <p className="text-xs text-muted-foreground">
                {stats.failedCount} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto Submitted</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.autoSubmittedCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Due to timeout
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Student Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-500">
                Students haven't submitted this exam yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Time Taken</TableHead>
                    <TableHead>Attempted</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions
                    .filter(s => s.is_submitted)
                    .map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {submission.roll_number || 'N/A'}
                        </TableCell>
                        <TableCell>{submission.student_name}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {submission.student_email}
                        </TableCell>
                        <TableCell>{submission.student_section || 'N/A'}</TableCell>
                        <TableCell className="text-sm">
                          {submission.submitted_at
                            ? new Date(submission.submitted_at).toLocaleString()
                            : 'Not submitted'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            {submission.time_taken_minutes || 0} min
                          </div>
                        </TableCell>
                        <TableCell>
                          {calculateAttemptedQuestions(submission.answers)} Q
                        </TableCell>
                        <TableCell className="font-semibold">
                          {submission.total_score || 0} / {submission.max_score || 0}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            submission.percentage >= 70 ? 'text-green-600' :
                            submission.percentage >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {submission.percentage?.toFixed(1) || 0}%
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(submission)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewSubmission(submission)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
