"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Settings, Users, BarChart, Eye, EyeOff, Plus, ExternalLink, Copy, Clock, Calendar } from 'lucide-react'

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
      console.error('Error fetching exam data:', err)
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
    try {
      const response = await fetch(`/api/exams/${params.examId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_published: !exam?.is_published
        })
      })

      if (response.ok) {
        setExam(prev => prev ? { ...prev, is_published: !prev.is_published } : null)
      }
    } catch (error) {
      console.error('Error updating exam:', error)
    }
  }

  const copyExamUrl = () => {
    if (exam?.slug) {
      const fullUrl = `${window.location.origin}/exam/${exam.slug}`
      navigator.clipboard.writeText(fullUrl)
      alert('Exam URL copied to clipboard!')
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
        <div className="bg-white border-b border-purple-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <h1 className="text-2xl font-bold text-purple-900">Exam Not Found</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Exam Not Found</h3>
                <p className="text-gray-500 mb-4">{error || 'The exam you are looking for does not exist or you do not have permission to view it.'}</p>
                <Button onClick={handleBack}>Return to Dashboard</Button>
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
  const isUpcoming = startDate > new Date()
  const isActive = new Date() >= startDate && new Date() <= endDate
  const examUrl = `${window.location.origin}/exam/${exam.slug}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-purple-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-purple-900">{exam.title}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={exam.is_published ? "default" : "secondary"}>
                    {exam.is_published ? "Published" : "Draft"}
                  </Badge>
                  <Badge variant={isActive ? "default" : isUpcoming ? "secondary" : "outline"}>
                    {isActive ? "Active" : isUpcoming ? "Upcoming" : "Ended"}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Created {new Date(exam.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={copyExamUrl}>
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
              <Button variant="outline" onClick={openExamUrl}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Exam
              </Button>
              <Button variant="outline" onClick={handlePublishToggle}>
                {exam.is_published ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {exam.is_published ? "Unpublish" : "Publish"}
              </Button>
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Exam
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Exam Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Sections</p>
                  <p className="text-2xl font-bold text-purple-900">{exam.exam_sections.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold text-purple-900">{totalQuestions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Marks</p>
                  <p className="text-2xl font-bold text-purple-900">{exam.total_marks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Submissions</p>
                  <p className="text-2xl font-bold text-purple-900">{exam.submission_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam URL Display */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ExternalLink className="w-5 h-5" />
              <span>Exam URL</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <code className="flex-1 text-sm font-mono text-purple-800">{examUrl}</code>
              <Button size="sm" variant="outline" onClick={copyExamUrl}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={openExamUrl}>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Share this URL with students to allow them to access the exam.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList>
            <TabsTrigger value="content">Exam Content</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Exam Sections</h2>
              <Button onClick={() => router.push(`/teacher/exams/create?edit=${params.examId}`)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </div>

            {exam.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Exam Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{exam.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Exam Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Exam Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Start Time</p>
                    <p className="text-lg font-semibold">{startDate.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">End Time</p>
                    <p className="text-lg font-semibold">{endDate.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Duration</p>
                    <p className="text-lg font-semibold flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {exam.duration_minutes} minutes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {exam.exam_sections.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Sections Yet</h3>
                      <p className="text-gray-500 mb-4">Start building your exam by adding sections and questions.</p>
                      <Button onClick={() => router.push(`/teacher/exams/create?edit=${params.examId}`)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Section
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                exam.exam_sections.map((section, index) => (
                  <Card key={section.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>{index + 1}. {section.title}</span>
                          </CardTitle>
                          {section.description && (
                            <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {section.exam_questions.length} questions
                        </div>
                      </div>
                    </CardHeader>
                    {section.exam_questions.length > 0 && (
                      <CardContent>
                        <div className="space-y-2">
                          {section.exam_questions.map((examQuestion, qIndex) => (
                            <div key={examQuestion.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-gray-500">{qIndex + 1}.</span>
                                <div>
                                  <p className="font-medium">{examQuestion.question.title}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="outline">{examQuestion.question.type.toUpperCase()}</Badge>
                                    <span className="text-xs text-gray-500">{examQuestion.points} points</span>
                                  </div>
                                </div>
                              </div>
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

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Exam Submissions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">No submissions yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Submissions will appear here once students take the exam.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart className="w-5 h-5" />
                  <span>Exam Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">Analytics will be available once students start taking the exam.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Exam Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Publication Status</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant={exam.is_published ? "default" : "secondary"}>
                        {exam.is_published ? "Published" : "Draft"}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={handlePublishToggle}>
                        {exam.is_published ? "Unpublish Exam" : "Publish Exam"}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Exam Information</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Created:</strong> {new Date(exam.created_at).toLocaleString()}</p>
                      <p><strong>Last Updated:</strong> {new Date(exam.updated_at).toLocaleString()}</p>
                      <p><strong>Exam ID:</strong> {exam.id}</p>
                      <p><strong>Slug:</strong> {exam.slug}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
