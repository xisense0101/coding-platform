"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Settings, Users, BarChart, Eye, EyeOff, Plus } from 'lucide-react'

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
        logger.log('Sections data:', sectionsData)
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

  const handlePublishToggle = async () => {
    try {
      const response = await fetch(`/api/courses/${params.courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_published: !course?.is_published
        })
      })

      if (response.ok) {
        setCourse(prev => prev ? { ...prev, is_published: !prev.is_published } : null)
      }
    } catch (error) {
      logger.error('Error updating course:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="bg-white border-b border-blue-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <h1 className="text-2xl font-bold text-blue-900">Course Not Found</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Course Not Found</h3>
                <p className="text-gray-500 mb-4">{error || 'The course you are looking for does not exist or you do not have permission to view it.'}</p>
                <Button onClick={handleBack}>Return to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0)
  const publishedSections = sections.filter(section => section.is_published).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-blue-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-blue-900">{course.title}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={course.is_published ? "default" : "secondary"}>
                    {course.is_published ? "Published" : "Draft"}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Created {new Date(course.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handlePublishToggle}>
                {course.is_published ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {course.is_published ? "Unpublish" : "Publish"}
              </Button>
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Course
              </Button>
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Sections</p>
                  <p className="text-2xl font-bold text-blue-900">{sections.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold text-blue-900">{totalQuestions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Published Sections</p>
                  <p className="text-2xl font-bold text-blue-900">{publishedSections}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Students Enrolled</p>
                  <p className="text-2xl font-bold text-blue-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList>
            <TabsTrigger value="content">Course Content</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Course Sections</h2>
              <Button onClick={() => router.push(`/teacher/courses/create?edit=${params.courseId}`)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </div>

            {course.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{course.description}</p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {sections.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Sections Yet</h3>
                      <p className="text-gray-500 mb-4">Start building your course by adding sections and questions.</p>
                      <Button onClick={() => router.push(`/teacher/courses/create?edit=${params.courseId}`)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Section
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                sections.map((section, index) => (
                  <Card key={section.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>{index + 1}. {section.title}</span>
                            <Badge variant={section.is_published ? "default" : "secondary"}>
                              {section.is_published ? "Published" : "Draft"}
                            </Badge>
                          </CardTitle>
                          {section.description && (
                            <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {section.questions.length} questions
                        </div>
                      </div>
                    </CardHeader>
                    {section.questions.length > 0 && (
                      <CardContent>
                        <div className="space-y-2">
                          {section.questions.map((question, qIndex) => (
                            <div key={question.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-gray-500">{qIndex + 1}.</span>
                                <div>
                                  <p className="font-medium">{question.title}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="outline">{question.type.toUpperCase()}</Badge>
                                    <span className="text-xs text-gray-500">{question.points} points</span>
                                  </div>
                                </div>
                              </div>
                              <Badge variant={question.is_published ? "default" : "secondary"}>
                                {question.is_published ? "Published" : "Draft"}
                              </Badge>
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

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Enrolled Students</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">No students enrolled yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Students will appear here once they enroll in your course.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart className="w-5 h-5" />
                  <span>Course Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">Analytics will be available once students start using your course.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Course Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Publication Status</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant={course.is_published ? "default" : "secondary"}>
                        {course.is_published ? "Published" : "Draft"}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={handlePublishToggle}>
                        {course.is_published ? "Unpublish Course" : "Publish Course"}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Course Information</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Created:</strong> {new Date(course.created_at).toLocaleString()}</p>
                      <p><strong>Last Updated:</strong> {new Date(course.updated_at).toLocaleString()}</p>
                      <p><strong>Course ID:</strong> {course.id}</p>
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
