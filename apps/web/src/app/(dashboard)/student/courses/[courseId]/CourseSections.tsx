"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft, BookOpen, Play, CheckCircle2, Clock, FileText, Code, Video, PenTool, Lock, Star, TrendingUp, Users, Calendar, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Lesson {
  id: string
  title: string
  type: 'reading' | 'mcq' | 'coding' | 'essay'
  duration?: string
  isCompleted: boolean
  isLocked: boolean
  points?: number
}

interface Section {
  id: string
  title: string
  description?: string
  lessons: Lesson[]
  isCompleted: boolean
  progress: number
  order_index?: number
}

interface CourseData {
  id: string
  title: string
  description?: string
  totalProgress?: number
  sections: Section[]
  teacher?: {
    full_name?: string
    email?: string
  }
  enrollment?: {
    progress_percentage?: number
  }
}

interface CourseSectionsProps {
  courseData: CourseData
  userId: string
}

export default function CourseSections({ courseData, userId }: CourseSectionsProps) {
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [activeTab, setActiveTab] = useState("content")
  const router = useRouter()

  // Transform database data to component format
  const processedCourse = useMemo(() => {
    const sections: Section[] = (courseData.sections || []).map((section: any) => {
      const questions = section.questions || []
      const lessons: Lesson[] = questions.map((question: any, index: number) => ({
        id: question.id,
        title: question.title || `Question ${index + 1}`,
        type: question.type as 'reading' | 'mcq' | 'coding' | 'essay',
        duration: `${question.points || 5} min`,
        isCompleted: false, // TODO: Get from user progress
        isLocked: index > 0 && false, // TODO: Implement locking logic
        points: question.points || 1
      }))

      // Calculate section progress
      const completedLessons = lessons.filter(l => l.isCompleted).length
      const progress = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0

      return {
        id: section.id,
        title: section.title,
        description: section.description,
        lessons,
        isCompleted: progress === 100,
        progress,
        order_index: section.order_index
      }
    })

    // Sort sections by order_index
    sections.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))

    const totalProgress = courseData.enrollment?.progress_percentage || 0

    return {
      ...courseData,
      sections,
      totalProgress
    }
  }, [courseData])

  useEffect(() => {
    if (processedCourse.sections.length > 0 && !selectedSection) {
      setSelectedSection(processedCourse.sections[0])
    }
  }, [processedCourse.sections, selectedSection])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return <FileText className="h-4 w-4" />
      case 'mcq': return <CheckCircle2 className="h-4 w-4" />
      case 'coding': return <Code className="h-4 w-4" />
      case 'essay': return <PenTool className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reading': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'mcq': return 'bg-green-100 text-green-700 border-green-200'
      case 'coding': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'essay': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-sky-100 text-sky-700 border-sky-200'
    }
  }

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.isLocked) {
      alert("This lesson is locked. Please complete previous lessons.")
      return
    }
    router.push(`/student/courses/${courseData.id}/lesson/${lesson.id}`)
  }

  const handleBackClick = () => {
    router.push('/student/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      {/* Header */}
      <div className="border-b border-sky-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackClick}
              className="border-sky-300 text-sky-700 hover:bg-sky-50"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-sky-900">{processedCourse.title}</h1>
              <p className="text-sky-600 text-sm">
                {processedCourse.teacher?.full_name && `Instructor: ${processedCourse.teacher.full_name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <div className="font-medium text-sky-900">Progress</div>
              <div className="text-sky-600">{Math.round(processedCourse.totalProgress || 0)}% Complete</div>
            </div>
            <Avatar className="h-8 w-8 border border-sky-200">
              <AvatarFallback className="bg-sky-100 text-sky-700">
                {processedCourse.teacher?.full_name?.charAt(0) || 'T'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-2 bg-sky-100">
            <TabsTrigger
              value="content"
              className="data-[state=active]:bg-white data-[state=active]:text-sky-900"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Course Content
            </TabsTrigger>
            <TabsTrigger
              value="scores"
              className="data-[state=active]:bg-white data-[state=active]:text-sky-900"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Progress & Scores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            {/* Course Progress */}
            <Card className="border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-sky-900">Course Progress</h3>
                    <p className="text-sky-600">
                      {processedCourse.sections.filter(s => s.isCompleted).length} of {processedCourse.sections.length} sections completed
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-sky-900">{Math.round(processedCourse.totalProgress || 0)}%</div>
                    <div className="text-sm text-sky-600">Overall Progress</div>
                  </div>
                </div>
                <Progress
                  value={processedCourse.totalProgress || 0}
                  className="h-3 bg-sky-100"
                />
              </CardContent>
            </Card>

            {/* Sections Overview */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedCourse.sections.map((section) => (
                <Card
                  key={section.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                    selectedSection?.id === section.id
                      ? 'border-sky-400 bg-sky-50'
                      : 'border-sky-200 hover:border-sky-300'
                  }`}
                  onClick={() => setSelectedSection(section)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={section.isCompleted ? "default" : "secondary"}
                        className={section.isCompleted ? "bg-green-500" : ""}
                      >
                        {section.isCompleted ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                        {section.isCompleted ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-sky-900 mb-1">{section.title}</h4>
                    {section.description && (
                      <p className="text-sm text-sky-600 mb-3">{section.description}</p>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-sky-600">{section.lessons.length} lessons</span>
                        <span className="font-medium text-sky-900">{Math.round(section.progress)}%</span>
                      </div>
                      <Progress value={section.progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Section Details */}
            {selectedSection && (
              <Card className="border-sky-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-sky-900">{selectedSection.title}</h3>
                      {selectedSection.description && (
                        <p className="text-sky-600 mt-1">{selectedSection.description}</p>
                      )}
                    </div>
                    <Badge
                      variant={selectedSection.isCompleted ? "default" : "secondary"}
                      className={selectedSection.isCompleted ? "bg-green-500" : ""}
                    >
                      {selectedSection.lessons.filter(l => l.isCompleted).length} / {selectedSection.lessons.length} Complete
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {selectedSection.lessons.map((lesson, index) => (
                      <Card
                        key={lesson.id}
                        className={`transition-all duration-200 cursor-pointer hover:shadow-sm ${
                          lesson.isLocked ? 'opacity-60' : 'hover:border-sky-300'
                        }`}
                        onClick={() => handleLessonClick(lesson)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full border ${getTypeColor(lesson.type)}`}>
                                {getTypeIcon(lesson.type)}
                              </div>
                              <div>
                                <h5 className="font-medium text-sky-900">{lesson.title}</h5>
                                <p className="text-sm text-sky-600">
                                  {lesson.duration} • {lesson.points} points
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {lesson.isLocked ? (
                                <Lock className="h-5 w-5 text-gray-400" />
                              ) : lesson.isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <Play className="h-5 w-5 text-sky-500" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="scores" className="space-y-6">
            <Card className="border-sky-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-sky-900 mb-4">Progress & Scores</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {processedCourse.sections.map((section) => (
                    <Card key={section.id} className="border-sky-100">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-sky-900 mb-2">{section.title}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-sky-600">Progress</span>
                            <span className="font-medium">{Math.round(section.progress)}%</span>
                          </div>
                          <Progress value={section.progress} className="h-2" />
                          <div className="flex justify-between text-sm">
                            <span className="text-sky-600">Completed Lessons</span>
                            <span className="font-medium">
                              {section.lessons.filter(l => l.isCompleted).length} / {section.lessons.length}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
