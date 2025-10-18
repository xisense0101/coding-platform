'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Plus, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award, 
  Eye, 
  Edit, 
  Trash2, 
  Settings,
  GraduationCap,
  Target,
  Activity,
  LogOut,
  User
} from 'lucide-react'
import { StatCard, CourseCard, ActivityItem } from '@/components/common/UIComponents'
import { useTeacherCourses, useTeacherStats, useTeacherExams, useTeacherActivity } from '@/hooks/useData'
import { useAuth } from '@/lib/auth/AuthContext'

import { useRouter } from 'next/navigation'

import { logger } from '@/lib/utils/logger'

export default function TeacherDashboard() {
  const router = useRouter()
  const { signOut, userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  
  // Use real data hooks
  const { courses, loading: coursesLoading } = useTeacherCourses()
  const { stats, loading: statsLoading } = useTeacherStats()
  const { exams, loading: examsLoading } = useTeacherExams()
  const { activities, loading: activitiesLoading } = useTeacherActivity()

  const handleCreateCourse = () => {
    router.push('/teacher/courses/create')
  }

  const handleCreateExam = () => {
    router.push('/teacher/exams/create')
  }

  const handleLogout = async () => {
    try {
      logger.log('Logout button clicked')
      
      // Prevent multiple clicks
      const button = document.querySelector('[data-logout-btn]') as HTMLButtonElement
      if (button) {
        button.disabled = true
        button.textContent = 'Logging out...'
      }
      
      await signOut()
    } catch (error) {
      logger.error('Logout error:', error)
      // Fallback: Force navigation to login even if signOut fails
      window.location.href = '/auth/login'
    }
  }

  // Transform courses data for UI
  const transformedCourses = courses.map(course => ({
    id: course.id,
    title: course.title,
    description: course.description || 'No description available',
    progress: Math.floor(Math.random() * 100), // Mock progress for now
    status: course.published ? 'active' as const : 'completed' as const, // Use completed instead of draft
    studentCount: Math.floor(Math.random() * 50) + 10, // Mock student count
    nextDeadline: 'Assignment due Jan 15' // Mock deadline
  }))

  // Transform exams data for UI
  const upcomingExams = exams.map(exam => {
    const startDate = exam.start_time ? new Date(exam.start_time) : new Date()
    const isUpcoming = startDate > new Date()
    
    return {
      id: exam.id,
      originalId: exam.id, // Keep the original ID for API calls
      title: exam.title,
      course: exam.description || 'No description',
      slug: exam.slug,
      isPublished: exam.is_published,
      testCode: exam.test_code,
      testCodeType: exam.test_code_type,
      testCodeRotationMinutes: exam.test_code_rotation_minutes,
      date: startDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: startDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      students: exam.submission_count || 0,
      status: isUpcoming ? 'upcoming' : exam.is_published ? 'active' : 'draft',
      totalMarks: exam.total_marks || 0,
      duration: exam.duration_minutes || 0
    }
  })

  const handleToggleExamStatus = async (examId: string, isPublished: boolean) => {
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_published: isPublished
        })
      })

      if (response.ok) {
        // Refresh the data
        window.location.reload()
      } else {
        alert('Failed to update exam status')
      }
    } catch (error) {
      logger.error('Error updating exam status:', error)
      alert('Failed to update exam status')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {userProfile?.full_name || 'Professor'}! 👋
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your courses today.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">{userProfile?.email}</span>
            </div>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button size="sm" onClick={handleCreateCourse}>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              data-logout-btn
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsLoading ? (
            // Loading skeleton
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                title="Total Courses"
                value={stats?.totalCourses || 0}
                description="Active and completed courses"
                icon={<BookOpen className="h-5 w-5 text-emerald-600" />}
                color="green"
                trend={{ value: 12.5, isPositive: true }}
              />
              <StatCard
                title="Total Students"
                value={stats?.totalStudents || 0}
                description="Enrolled across all courses"
                icon={<Users className="h-5 w-5 text-blue-600" />}
                color="blue"
                trend={{ value: 8.3, isPositive: true }}
              />
              <StatCard
                title="Active Exams"
                value={stats?.totalExams || 0}
                description="Currently running"
                icon={<FileText className="h-5 w-5 text-purple-600" />}
                color="purple"
              />
              <StatCard
                title="Average Score"
                value={`${stats?.averageScore || 0}%`}
                description="Across all assessments"
                icon={<Target className="h-5 w-5 text-orange-600" />}
                color="orange"
                trend={{ value: 3.2, isPositive: true }}
              />
            </>
          )}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activitiesLoading ? (
                      // Loading skeleton
                      Array(4).fill(0).map((_, i) => (
                        <div key={i} className="animate-pulse flex space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      activities.map((activity) => (
                        <ActivityItem
                          key={activity.id}
                          type={activity.type}
                          message={activity.message}
                          time={activity.time}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Upcoming */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="ghost" onClick={handleCreateCourse}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Course
                    </Button>
                    <Button className="w-full justify-start" variant="ghost">
                      <FileText className="h-4 w-4 mr-2" />
                      Create Assignment
                    </Button>
                    <Button className="w-full justify-start" variant="ghost" onClick={handleCreateExam}>
                      <Edit className="h-4 w-4 mr-2" />
                      Create Exam
                    </Button>
                    <Button className="w-full justify-start" variant="ghost">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Students
                    </Button>
                    <Button className="w-full justify-start" variant="ghost">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                    <Button className="w-full justify-start" variant="ghost">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Session
                    </Button>
                  </CardContent>
                </Card>

                {/* Upcoming Exams */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Upcoming Exams
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {upcomingExams.length > 0 ? upcomingExams.map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{exam.title}</p>
                          <p className="text-xs text-gray-600">{exam.course}</p>
                          <p className="text-xs text-gray-500">
                            {exam.students} submissions • {exam.totalMarks} marks • {exam.duration} minutes
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{exam.date}</p>
                          <p className="text-xs text-gray-500">{exam.time}</p>
                          <Badge 
                            variant={exam.status === 'upcoming' ? 'default' : exam.status === 'active' ? 'secondary' : 'outline'} 
                            className="text-xs mt-1"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No exams created yet</p>
                        <p className="text-sm">Create your first exam to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">My Courses</h2>
              <Button onClick={handleCreateCourse}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Course
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coursesLoading ? (
                // Loading skeleton
                Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-2 bg-gray-200 rounded mb-2"></div>
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                transformedCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    description={course.description}
                    progress={course.progress}
                    status={course.status}
                    studentCount={course.studentCount}
                    nextDeadline={course.nextDeadline}
                    isTeacher={true}
                    onClick={() => router.push(`/teacher/courses/${course.id}`)}
                    onEdit={() => router.push(`/teacher/courses/${course.id}/edit`)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="exams" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Exam Management</h2>
              <Button onClick={handleCreateExam}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Exam
              </Button>
            </div>
            
            <div className="grid gap-6">
              {examsLoading ? (
                // Loading skeleton
                Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))
              ) : upcomingExams.length > 0 ? (
                upcomingExams.map((exam) => (
                  <Card key={exam.id} className="border-purple-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{exam.title}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{exam.course}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>📅 {exam.date} at {exam.time}</span>
                            <span>⏱️ {exam.duration} minutes</span>
                            <span>📊 {exam.totalMarks} marks</span>
                          </div>
                          <div className="mt-2 text-xs text-blue-600">
                            URL: /exam/{exam.slug}
                          </div>
                          {exam.testCode && (
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-xs text-gray-500">Test Code:</span>
                              <code className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {exam.testCode}
                              </code>
                              {exam.testCodeType === 'rotating' && (
                                <Badge variant="outline" className="text-xs">
                                  Rotates every {exam.testCodeRotationMinutes}min
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={exam.status === 'upcoming' ? 'default' : exam.status === 'active' ? 'secondary' : 'outline'}
                          >
                            {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                          </Badge>
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {exam.students} submissions
                          </Badge>
                          <Badge 
                            variant={exam.isPublished ? 'default' : 'secondary'}
                            className={exam.isPublished ? 'bg-green-600' : 'bg-gray-400'}
                          >
                            {exam.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Exam ID: {exam.id}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/teacher/exams/${exam.originalId}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/teacher/exams/create?edit=${exam.originalId}`)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={exam.isPublished ? "secondary" : "default"}
                            onClick={() => handleToggleExamStatus(exam.originalId, !exam.isPublished)}
                            className={exam.isPublished ? "bg-orange-500 hover:bg-orange-600" : "bg-green-600 hover:bg-green-700"}
                          >
                            {exam.isPublished ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => router.push(`/teacher/exams/${exam.originalId}/results`)}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Results
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed border-gray-300">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No exams created yet</h3>
                    <p className="text-gray-500 mb-4 text-center">
                      Create your first exam to start assessing your students
                    </p>
                    <Button onClick={handleCreateExam} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Exam
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
            
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {coursesLoading ? (
                      // Loading skeleton
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="animate-pulse space-y-2">
                          <div className="flex justify-between">
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          </div>
                          <div className="h-2 bg-gray-200 rounded"></div>
                          <div className="flex justify-between">
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      transformedCourses.slice(0, 4).map((course) => (
                        <div key={course.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{course.title}</span>
                            <span className="text-gray-600">{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{course.studentCount} students</span>
                            <span>{course.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Trends</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Student Engagement</p>
                      <p className="text-xs text-gray-600">Last 7 days</p>
                    </div>
                    <div className="flex items-center space-x-1 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">+12%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Assignment Completion</p>
                      <p className="text-xs text-gray-600">This month</p>
                    </div>
                    <div className="flex items-center space-x-1 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">+8%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Average Score</p>
                      <p className="text-xs text-gray-600">All courses</p>
                    </div>
                    <div className="flex items-center space-x-1 text-orange-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">+3%</span>
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
