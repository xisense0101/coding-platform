'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PieChart } from '@/components/ui/pie-chart'
import { logger } from '@/lib/utils/logger'
import {
  ArrowLeft,
  Eye,
  Download,
  Clock,
  CheckCircle,
  Users,
  TrendingUp,
  FileText,
  AlertCircle,
  Award,
  BarChart3,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

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
  
  // New state for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string>('submitted_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all')

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
      logger.error('Error fetching results:', error)
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
      return <Badge className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100">In Progress</Badge>
    }
    if (submission.auto_submitted) {
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">Auto Submitted</Badge>
    }
    if (submission.is_passed) {
      return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Passed</Badge>
    }
    return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Failed</Badge>
  }

  const calculateAttemptedQuestions = (answers: Record<string, any>) => {
    if (!answers) return 0
    return Object.keys(answers).length
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getFilteredAndSortedSubmissions = () => {
    let filtered = submissions.filter(s => s.is_submitted)

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.roll_number && s.roll_number.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply status filter
    if (filterStatus === 'passed') {
      filtered = filtered.filter(s => s.is_passed)
    } else if (filterStatus === 'failed') {
      filtered = filtered.filter(s => !s.is_passed)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof Submission]
      let bValue: any = b[sortField as keyof Submission]

      if (sortField === 'student_name') {
        aValue = a.student_name
        bValue = b.student_name
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    })

    return filtered
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading exam results...</p>
          </div>
        </div>
      </div>
    )
  }

  const filteredSubmissions = getFilteredAndSortedSubmissions()
  const submittedSubmissions = submissions.filter(s => s.is_submitted)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/teacher/dashboard')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-8 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{exam?.title}</h1>
                <p className="text-sm text-gray-600 mt-0.5">Exam Results & Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-blue-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.completedSubmissions}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {stats.inProgressSubmissions} in progress
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Average Score</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.averageScore.toFixed(1)}
                      <span className="text-lg text-gray-500">/{exam?.totalMarks || 0}</span>
                    </p>
                    <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stats.averagePercentage.toFixed(1)}% average
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pass Rate</p>
                    <p className="text-3xl font-bold text-green-600">{stats.passedCount}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {stats.failedCount} failed
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Auto Submitted</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.autoSubmittedCount}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Due to timeout
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Performance Distribution Chart */}
        <Card className="mb-8 border-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pie Chart */}
              <div className="flex flex-col items-center justify-center">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Performance Overview</h3>
                <div className="relative w-64 h-64">
                  <PieChart 
                    data={[
                      { range: '90-100%', count: submittedSubmissions.filter(s => s.percentage >= 90).length, color: '#10b981' },
                      { range: '80-89%', count: submittedSubmissions.filter(s => s.percentage >= 80 && s.percentage < 90).length, color: '#3b82f6' },
                      { range: '70-79%', count: submittedSubmissions.filter(s => s.percentage >= 70 && s.percentage < 80).length, color: '#6366f1' },
                      { range: '50-69%', count: submittedSubmissions.filter(s => s.percentage >= 50 && s.percentage < 70).length, color: '#eab308' },
                      { range: '0-49%', count: submittedSubmissions.filter(s => s.percentage < 50).length, color: '#ef4444' }
                    ]}
                  />
                </div>
                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  {[
                    { range: '90-100%', color: 'bg-green-500', count: submittedSubmissions.filter(s => s.percentage >= 90).length },
                    { range: '80-89%', color: 'bg-blue-500', count: submittedSubmissions.filter(s => s.percentage >= 80 && s.percentage < 90).length },
                    { range: '70-79%', color: 'bg-indigo-500', count: submittedSubmissions.filter(s => s.percentage >= 70 && s.percentage < 80).length },
                    { range: '50-69%', color: 'bg-yellow-500', count: submittedSubmissions.filter(s => s.percentage >= 50 && s.percentage < 70).length },
                    { range: '0-49%', color: 'bg-red-500', count: submittedSubmissions.filter(s => s.percentage < 50).length }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                      <span className="text-xs text-gray-600">{item.range} ({item.count})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Student Count by Range</h3>
                <div className="flex-1 flex items-end justify-around gap-4 px-4">
                  {[
                    { range: '90-100', color: 'bg-green-500', count: submittedSubmissions.filter(s => s.percentage >= 90).length },
                    { range: '80-89', color: 'bg-blue-500', count: submittedSubmissions.filter(s => s.percentage >= 80 && s.percentage < 90).length },
                    { range: '70-79', color: 'bg-indigo-500', count: submittedSubmissions.filter(s => s.percentage >= 70 && s.percentage < 80).length },
                    { range: '50-69', color: 'bg-yellow-500', count: submittedSubmissions.filter(s => s.percentage >= 50 && s.percentage < 70).length },
                    { range: '0-49', color: 'bg-red-500', count: submittedSubmissions.filter(s => s.percentage < 50).length }
                  ].map((item, idx) => {
                    const maxCount = Math.max(...[
                      submittedSubmissions.filter(s => s.percentage >= 90).length,
                      submittedSubmissions.filter(s => s.percentage >= 80 && s.percentage < 90).length,
                      submittedSubmissions.filter(s => s.percentage >= 70 && s.percentage < 80).length,
                      submittedSubmissions.filter(s => s.percentage >= 50 && s.percentage < 70).length,
                      submittedSubmissions.filter(s => s.percentage < 50).length
                    ]);
                    const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="relative w-full" style={{ height: '200px' }}>
                          <div className="absolute bottom-0 w-full flex flex-col items-center">
                            <div className="mb-2 font-bold text-gray-900 text-lg">{item.count}</div>
                            <div 
                              className={`w-full ${item.color} rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer flex items-end justify-center pb-2`}
                              style={{ 
                                height: `${Math.max(heightPercent, item.count > 0 ? 20 : 0)}px`,
                                minHeight: item.count > 0 ? '40px' : '0px'
                              }}
                            >
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-700">{item.range}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Table */}
        <Card className="border-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Student Submissions ({filteredSubmissions.length})
              </CardTitle>
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {/* Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="passed">Passed Only</option>
                  <option value="failed">Failed Only</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || filterStatus !== 'all' ? 'No results found' : 'No submissions yet'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Students haven\'t submitted this exam yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('roll_number')}
                      >
                        <div className="flex items-center gap-2">
                          Roll No.
                          <SortIcon field="roll_number" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('student_name')}
                      >
                        <div className="flex items-center gap-2">
                          Name
                          <SortIcon field="student_name" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Section
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('submitted_at')}
                      >
                        <div className="flex items-center gap-2">
                          Submitted At
                          <SortIcon field="submitted_at" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('time_taken_minutes')}
                      >
                        <div className="flex items-center gap-2">
                          Time Taken
                          <SortIcon field="time_taken_minutes" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Attempted
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('total_score')}
                      >
                        <div className="flex items-center gap-2">
                          Score
                          <SortIcon field="total_score" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('percentage')}
                      >
                        <div className="flex items-center gap-2">
                          Percentage
                          <SortIcon field="percentage" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredSubmissions.map((submission, index) => (
                      <tr 
                        key={submission.id} 
                        className="hover:bg-blue-50 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">{submission.roll_number || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {submission.student_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{submission.student_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {submission.student_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                            Section {submission.student_section || 'N/A'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {submission.submitted_at
                            ? new Date(submission.submitted_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Not submitted'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{submission.time_taken_minutes || 0} min</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-700">
                            {calculateAttemptedQuestions(submission.answers)} Q
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-gray-900">
                            {submission.total_score || 0}
                          </span>
                          <span className="text-gray-500">/{submission.max_score || 0}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  submission.percentage >= 70 ? 'bg-green-500' :
                                  submission.percentage >= 50 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${submission.percentage}%` }}
                              />
                            </div>
                            <span className={`font-semibold ${
                              submission.percentage >= 70 ? 'text-green-600' :
                              submission.percentage >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {submission.percentage?.toFixed(1) || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(submission)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handlePreviewSubmission(submission)}
                            className="px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2 opacity-0 group-hover:opacity-100"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm font-medium">Preview</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}