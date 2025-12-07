"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  Edit,
  Eye,
  EyeOff,
  Settings,
  Plus,
  Users,
  BarChart,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react'

import { logger } from '@/lib/utils/logger'

interface Course {
  id: string
  title: string
  description: string
  teacher_id: string
  is_published: boolean
  created_at: string
  updated_at: string
}

interface Section {
  id: string
  title: string
  description: string
  order_index: number
  is_published: boolean
  questions: Question[]
}

interface Question {
  id: string
  type: string
  title: string
  description: string
  points: number
  is_published: boolean
}

export default function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'students' | 'analytics' | 'settings'>('content')
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    fetchCourseData()
  }, [params.courseId])

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch course details
      const courseResponse = await fetch(`/api/courses/${params.courseId}`)
      if (!courseResponse.ok) {
        throw new Error('Failed to fetch course')
      }
      const courseData = await courseResponse.json()
      setCourse(courseData)

      // Fetch course sections
      const sectionsResponse = await fetch(`/api/courses/${params.courseId}/sections`)
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json()
        setSections(sectionsData)
      } else {
        logger.error('Failed to fetch sections:', sectionsResponse.status)
      }
    } catch (err) {
      logger.error('Error fetching course data:', err)
      setError('Failed to load course data')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/teacher/dashboard')
  }

  const handleEdit = () => {
    router.push(`/teacher/courses/create?edit=${params.courseId}`)
  }

  const handleAddSection = () => {
    router.push(`/teacher/courses/create?edit=${params.courseId}`)
  }

  const handlePublishToggle = async () => {
    if (!course) return
    setIsPublishing(true)
    try {
      const response = await fetch(`/api/courses/${params.courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_published: !course.is_published
        })
      })

      if (response.ok) {
        setCourse(prev => prev ? { ...prev, is_published: !prev.is_published } : null)
      } else {
        throw new Error('Failed to update course status')
      }
    } catch (error) {
      logger.error('Error updating course:', error)
      // Ideally show a toast here
    } finally {
      setIsPublishing(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getQuestionTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mcq':
        return '📝'
      case 'coding':
        return '💻'
      case 'essay':
        return '📖'
      default:
        return '📄'
    }
  }

  const getQuestionTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mcq':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', label: 'Quiz' }
      case 'coding':
        return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', label: 'Code' }
      case 'essay':
        return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', label: 'Reading' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', label: type }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Course Not Found</h3>
          <p className="text-gray-500 mb-6">{error || 'The course you are looking for does not exist or you do not have permission to view it.'}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0)
  const publishedSections = sections.filter(section => section.is_published).length
  const totalPoints = sections.reduce(
    (sum, section) => sum + section.questions.reduce((qSum, q) => qSum + (q.points || 0), 0),
    0
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl text-gray-900">{course.title}</h1>
                  <span
                    className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${
                      course.is_published
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    {course.is_published ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Published
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        Draft
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Created {new Date(course.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePublishToggle}
                disabled={isPublishing}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {course.is_published ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Publish
                  </>
                )}
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm shadow-sm">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 mb-1">Total Sections</p>
                  <p className="text-2xl text-blue-900">{sections.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 mb-1">Total Questions</p>
                  <p className="text-2xl text-purple-900">{totalQuestions}</p>
                </div>
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 mb-1">Published</p>
                  <p className="text-2xl text-green-900">{publishedSections}/{sections.length}</p>
                </div>
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-600 mb-1">Total Points</p>
                  <p className="text-2xl text-orange-900">{totalPoints}</p>
                </div>
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <BarChart className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mb-6 bg-white rounded-xl p-1 border border-gray-200 w-fit">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                activeTab === 'content'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Course Content
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                activeTab === 'students'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Settings
            </button>
          </div>

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg text-gray-900">Course Sections</h2>
                <button
                  onClick={handleAddSection}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Section
                </button>
              </div>

              {/* Course Description */}
              {course.description && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-gray-900 mb-2 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    Course Description
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{course.description}</p>
                </div>
              )}

              {/* Sections List */}
              <div className="space-y-4">
                {sections.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-900 mb-2">No Sections Yet</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Start building your course by adding sections and questions.
                    </p>
                    <button
                      onClick={handleAddSection}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Section
                    </button>
                  </div>
                ) : (
                  sections.map((section, index) => (
                    <div key={section.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-gray-900">
                                {index + 1}. {section.title}
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  section.is_published
                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                                }`}
                              >
                                {section.is_published ? 'Published' : 'Draft'}
                              </span>
                            </div>
                            {section.description && (
                              <p className="text-sm text-gray-600">{section.description}</p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 ml-4">
                            {section.questions.length} question{section.questions.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      {section.questions.length > 0 && (
                        <div className="p-6">
                          <div className="space-y-2">
                            {section.questions.map((question, qIndex) => {
                              const badge = getQuestionTypeBadge(question.type);
                              return (
                                <div
                                  key={question.id}
                                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <span className="text-xl">{getQuestionTypeIcon(question.type)}</span>
                                    <div className="flex-1">
                                      <p className="text-gray-900 text-sm">{question.title}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span
                                          className={`px-2 py-0.5 ${badge.bg} ${badge.text} border ${badge.border} rounded text-xs`}
                                        >
                                          {badge.label}
                                        </span>
                                        <span className="text-xs text-gray-500">{question.points} points</span>
                                      </div>
                                    </div>
                                  </div>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      question.is_published
                                        ? 'bg-green-100 text-green-700 border border-green-300'
                                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                                    }`}
                                  >
                                    {question.is_published ? 'Published' : 'Draft'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-gray-900 mb-2">Enrolled Students</h3>
              <p className="text-gray-500 text-sm mb-1">No students enrolled yet.</p>
              <p className="text-gray-400 text-xs">
                Students will appear here once they enroll in your course.
              </p>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <BarChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-gray-900 mb-2">Course Analytics</h3>
              <p className="text-gray-500 text-sm">
                Analytics will be available once students start using your course.
              </p>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-gray-900 mb-4">Publication Status</h3>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      course.is_published
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    {course.is_published ? 'Published' : 'Draft'}
                  </span>
                  <button
                    onClick={handlePublishToggle}
                    disabled={isPublishing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                  >
                    {isPublishing
                      ? 'Updating...'
                      : course.is_published
                      ? 'Unpublish Course'
                      : 'Publish Course'}
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-gray-900 mb-4">Course Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 min-w-32">Created:</span>
                    <span className="text-gray-900">{formatDateTime(course.created_at)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 min-w-32">Last Updated:</span>
                    <span className="text-gray-900">{formatDateTime(course.updated_at)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 min-w-32">Course ID:</span>
                    <span className="text-gray-900 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {course.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
