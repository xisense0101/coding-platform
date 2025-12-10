"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Edit, 
  Settings, 
  Users, 
  BarChart3, 
  Eye, 
  EyeOff, 
  Plus, 
  ExternalLink, 
  Copy, 
  Clock, 
  Calendar,
  BookOpen,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  FileText,
  Award,
  Activity,
  Globe,
  Lock,
  Unlock
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

import { logger } from '@/lib/utils/logger'

interface Exam {
  id: string
  title: string
  description: string
  slug: string
  start_time: string
  end_time: string
  duration_minutes: number
  total_marks: number
  is_published: boolean
  submission_count: number
  average_score: number
  created_at: string
  updated_at: string
  teacher: {
    full_name: string
  }
  exam_sections: ExamSection[]
  allowed_ip?: string
  invite_token?: string
}

interface ExamSection {
  id: string
  title: string
  description: string
  order_index: number
  exam_questions: ExamQuestion[]
}

interface ExamQuestion {
  id: string
  points: number
  question: {
    id: string
    title: string
    type: string
  }
}

export default function ExamDetailPage({ params }: { params: { examId: string } }) {
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('content')
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    fetchExamData()
  }, [params.examId])

  const fetchExamData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch exam details
      const response = await fetch(`/api/exams/${params.examId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch exam')
      }
      const examData = await response.json()
      setExam(examData.exam)
    } catch (err) {
      logger.error('Error fetching exam data:', err)
      setError('Failed to load exam data')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/teacher/dashboard')
  }

  const handleEdit = () => {
    router.push(`/teacher/exams/create?edit=${params.examId}`)
  }

  const handlePublishToggle = async () => {
    if (!exam) return

    try {
      const response = await fetch(`/api/exams/${params.examId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_published: !exam.is_published
        })
      })

      if (response.ok) {
        setExam(prev => prev ? { ...prev, is_published: !prev.is_published } : null)
      }
    } catch (error) {
      logger.error('Error updating exam:', error)
    }
  }

  const copyExamUrl = () => {
    if (exam?.slug) {
      const fullUrl = `${window.location.origin}/exam/${exam.slug}`
      navigator.clipboard.writeText(fullUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const openExamUrl = () => {
    if (exam?.slug) {
      const fullUrl = `${window.location.origin}/exam/${exam.slug}`
      window.open(fullUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading exam details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Exam Not Found</h3>
                <p className="text-gray-600 mb-6">
                  {error || 'The exam you are looking for does not exist or you do not have permission to view it.'}
                </p>
                <button
                  onClick={handleBack}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const totalQuestions = exam.exam_sections.reduce((sum, section) => sum + section.exam_questions.length, 0)
  const startDate = new Date(exam.start_time)
  const endDate = new Date(exam.end_time)
  const now = new Date()
  const isUpcoming = startDate > now
  const isActive = now >= startDate && now <= endDate
  const isEnded = now > endDate
  const examUrl = `${window.location.origin}/exam/${exam.slug}`

  const getStatusInfo = () => {
    if (isActive) return { label: 'Active Now', color: 'bg-green-100 text-green-700 border-green-200', icon: Activity }
    if (isUpcoming) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock }
    return { label: 'Ended', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: CheckCircle2 }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  const getQuestionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mcq':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'coding':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'essay':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case 'true_false':
        return 'bg-teal-100 text-teal-700 border-teal-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{exam.title}</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge 
                    className={`${exam.is_published ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'} border flex items-center gap-1`}
                  >
                    {exam.is_published ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {exam.is_published ? 'Published' : 'Draft'}
                  </Badge>
                  <Badge className={`${statusInfo.color} border flex items-center gap-1`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    • Created {new Date(exam.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyExamUrl}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {copySuccess ? 'Copied!' : 'Copy URL'}
              </button>
              <button
                onClick={openExamUrl}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </button>
              <button
                onClick={handlePublishToggle}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                {exam.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {exam.is_published ? 'Unpublish' : 'Publish'}
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => alert('Exam settings')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Sections</p>
                  <p className="text-3xl font-bold text-gray-900">{exam.exam_sections.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Questions</p>
                  <p className="text-3xl font-bold text-gray-900">{totalQuestions}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Marks</p>
                  <p className="text-3xl font-bold text-gray-900">{exam.total_marks}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Submissions</p>
                  <p className="text-3xl font-bold text-gray-900">{exam.submission_count}</p>
                  {exam.submission_count > 0 && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {exam.average_score}% avg
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam URL Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Globe className="w-5 h-5" />
                Public Exam URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-white border border-blue-200 rounded-lg">
                <code className="flex-1 text-sm font-mono text-blue-700 break-all">{examUrl}</code>
                <button
                  onClick={copyExamUrl}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 shrink-0"
                >
                  <Copy className="w-4 h-4" />
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={openExamUrl}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </button>
              </div>
              {exam.allowed_ip && (
                <div className="mt-4 flex items-center gap-2 text-sm text-blue-800 bg-blue-100/50 p-2 rounded">
                  <Lock className="w-4 h-4" />
                  <span>Restricted to IP: <span className="font-mono font-bold">{exam.allowed_ip}</span></span>
                </div>
              )}
              <p className="text-sm text-gray-600 mt-3">
                Share this URL with students to allow them to access the exam. {exam.is_published ? 'The exam is currently published and accessible.' : 'Publish the exam to make it accessible to students.'}
              </p>
            </CardContent>
          </Card>

          {exam.invite_token && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Users className="w-5 h-5" />
                  Invite Link
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 bg-white border border-purple-200 rounded-lg">
                  <code className="flex-1 text-sm font-mono text-purple-700 break-all">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/invite/{exam.invite_token}
                  </code>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/invite/${exam.invite_token}`
                      navigator.clipboard.writeText(url)
                      alert('Invite link copied!')
                    }}
                    className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2 shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-purple-800 bg-purple-100/50 p-2 rounded">
                  <Clock className="w-4 h-4" />
                  <span>Waiting room enabled (30 min before start)</span>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Students using this link will see a countdown until the exam starts.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger value="content" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Exam Content
            </TabsTrigger>
            <TabsTrigger value="submissions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Exam Content</h2>
              <button 
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Section
              </button>
            </div>

            {/* Description Card */}
            {exam.description && (
              <Card className="border-blue-100">
                <CardHeader>
                  <CardTitle className="text-lg">Exam Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{exam.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Schedule Card */}
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Exam Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-gray-600">Start Time</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <p className="text-sm font-medium text-gray-600">End Time</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-purple-600" />
                      <p className="text-sm font-medium text-gray-600">Duration</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {exam.duration_minutes} minutes
                    </p>
                    <p className="text-sm text-gray-600">
                      {Math.floor(exam.duration_minutes / 60)}h {exam.duration_minutes % 60}m
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sections */}
            <div className="space-y-4">
              {exam.exam_sections.length === 0 ? (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sections Yet</h3>
                    <p className="text-gray-600 mb-6 text-center max-w-md">
                      Start building your exam by adding sections and questions.
                    </p>
                    <button 
                      onClick={handleEdit}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Section
                    </button>
                  </CardContent>
                </Card>
              ) : (
                exam.exam_sections.map((section, sectionIndex) => (
                  <Card key={section.id} className="border-blue-100 hover:shadow-md transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-semibold">
                              {sectionIndex + 1}
                            </span>
                            <span>{section.title}</span>
                          </CardTitle>
                          {section.description && (
                            <p className="text-sm text-gray-600 mt-2 ml-11">{section.description}</p>
                          )}
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          {section.exam_questions.length} question{section.exam_questions.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </CardHeader>
                    {section.exam_questions.length > 0 && (
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          {section.exam_questions.map((examQuestion, qIndex) => (
                            <div 
                              key={examQuestion.id} 
                              className="flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg transition-all group"
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <span className="w-8 h-8 bg-white border-2 border-gray-300 group-hover:border-blue-500 rounded-lg flex items-center justify-center font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
                                  {qIndex + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 mb-1.5">{examQuestion.question.title}</p>
                                  <div className="flex items-center gap-3">
                                    <Badge className={`${getQuestionTypeColor(examQuestion.question.type)} border text-xs`}>
                                      {examQuestion.question.type.toUpperCase()}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                      <Award className="w-3.5 h-3.5" />
                                      <span>{examQuestion.points} points</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => alert(`View question: ${examQuestion.question.title}`)}
                                className="px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">View</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <Card className="border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Student Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exam.submission_count > 0 ? (
                  <div className="py-8 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">{exam.submission_count} Submissions</p>
                    <p className="text-gray-600">Average Score: {exam.average_score}%</p>
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-2">No submissions yet</p>
                    <p className="text-sm text-gray-500">
                      Submissions will appear here once students take the exam.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Exam Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">Analytics will be available soon</p>
                  <p className="text-sm text-gray-500">
                    Detailed insights and performance metrics will appear here once students start taking the exam.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card className="border-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                  <CardTitle>Publication Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Publication Status</p>
                      <p className="text-sm text-gray-600">
                        {exam.is_published 
                          ? 'This exam is currently published and visible to students.' 
                          : 'This exam is currently in draft mode and not visible to students.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${exam.is_published ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'} border`}>
                        {exam.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <button
                        onClick={handlePublishToggle}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          exam.is_published 
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {exam.is_published ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {exam.is_published ? 'Unpublish Exam' : 'Publish Exam'}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                  <CardTitle>Exam Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Created</p>
                      <p className="font-medium text-gray-900">
                        {new Date(exam.created_at).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                      <p className="font-medium text-gray-900">
                        {new Date(exam.updated_at).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Exam ID</p>
                      <code className="font-mono text-sm text-gray-900">{exam.id}</code>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Slug</p>
                      <code className="font-mono text-sm text-gray-900">{exam.slug}</code>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Created by</p>
                      <p className="font-medium text-gray-900">{exam.teacher.full_name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
