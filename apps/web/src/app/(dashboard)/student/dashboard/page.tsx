'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Trophy, 
  Target, 
  TrendingUp, 
  PlayCircle, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Star,
  Award,
  Activity,
  BarChart3,
  Eye,
  Play,
  ChevronRight,
  Bell
} from 'lucide-react'
import { StatCard, CourseCard, ActivityItem } from '@/components/common/UIComponents'
import { useUser, useStudentCourses } from "@/hooks/useData"
import { useAuth } from '@/lib/auth/AuthContext'
import Link from 'next/link'

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const { user, loading: userLoading } = useUser()
  const { courses, loading: coursesLoading, refetch } = useStudentCourses()
  const { signOut, userProfile } = useAuth()

  // Use real data; userProfile is surfaced via AuthContext
  const currentUser = userProfile || user
  const studentCourses = courses || []

  // Calculate stats from real data
  const stats = {
    coursesEnrolled: studentCourses.length,
    coursesCompleted: studentCourses.filter(c => c.progress >= 100).length,
    currentStreak: 7, // This would come from activity tracking
    overallProgress: studentCourses.length > 0 
      ? Math.round(studentCourses.reduce((sum, course) => sum + (course.progress || 0), 0) / studentCourses.length)
      : 0
  }

  // Transform courses for display
  const enrolledCourses = studentCourses.map((course, index) => ({
    id: course.id,
    title: course.title,
    description: course.description || "No description available",
    progress: course.progress || 0,
    status: course.progress >= 100 ? "completed" as const : "active" as const,
    instructor: course.instructor || "Unknown Instructor",
    nextDeadline: course.progress >= 100 ? "Course Completed ✓" : `Continue learning - ${course.nextLesson || 'Next lesson'}`,
    difficulty: "Beginner" as const,
    rating: 4.5 + (index * 0.1), // Mock rating
    totalLessons: course.totalLessons || 20,
    completedLessons: course.completedLessons || Math.round((course.progress / 100) * (course.totalLessons || 20))
  }))

  const recentActivity = [
    { id: 1, type: "course" as const, message: "Continued learning in Database Management", time: "2 hours ago" },
    { id: 2, type: "exam" as const, message: "Started new practice session", time: "1 day ago" },
    { id: 3, type: "course" as const, message: "Accessed course materials", time: "2 days ago" },
    { id: 4, type: "student" as const, message: "Profile updated successfully", time: "3 days ago" }
  ]

  const upcomingDeadlines = [
    { id: 1, title: "Database Final Exam", course: "Database Management", dueDate: "Jan 15, 2024", priority: "high", slug: "database-final-exam" },
    { id: 2, title: "React Assessment", course: "Frontend Development", dueDate: "Jan 18, 2024", priority: "medium", slug: "react-assessment" },
    { id: 3, title: "Data Structures Quiz", course: "DSA Course", dueDate: "Jan 22, 2024", priority: "high", slug: "dsa-quiz" }
  ]

  const achievements = [
    { id: 1, title: "First Course", description: "Successfully enrolled in first course", icon: "🎓", earned: true },
    { id: 2, title: "Quick Start", description: "Started learning within 24 hours", icon: "⚡", earned: true },
    { id: 3, title: "Dedicated Learner", description: "Accessed platform 5 days in a row", icon: "🔥", earned: stats.currentStreak >= 5 },
    { id: 4, title: "Course Completer", description: "Complete your first course", icon: "🏆", earned: stats.coursesCompleted > 0 }
  ]

  const recommendedCourses = [
    { 
      id: "r1", 
      title: "Advanced Database Concepts", 
      instructor: "Prof. Brown",
      rating: 4.8,
      students: 234,
      difficulty: "Advanced" as const
    },
    { 
      id: "r2", 
      title: "Full Stack Development", 
      instructor: "Prof. Taylor",
      rating: 4.9,
      students: 189,
      difficulty: "Intermediate" as const
    },
    { 
      id: "r3", 
      title: "Data Structures Deep Dive", 
      instructor: "Prof. Anderson",
      rating: 4.7,
      students: 445,
      difficulty: "Advanced" as const
    }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-green-500 bg-green-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  // Loading state
  if (userLoading || coursesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back! 🎓
            </h1>
            <p className="text-gray-600">
              Continue your learning journey and track your progress.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
              <Bell className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">{currentUser?.email || currentUser?.full_name || 'Student'}</span>
            </div>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              My Progress
            </Button>
            <Button size="sm">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Courses
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  const btn = document.querySelector('[data-logout-btn-student]') as HTMLButtonElement
                  if (btn) { btn.disabled = true; btn.textContent = 'Logging out...' }
                  await signOut()
                } catch (err) {
                  console.error('Logout error:', err)
                  window.location.href = '/auth/login'
                }
              }}
              data-logout-btn-student
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Courses Enrolled"
            value={stats.coursesEnrolled}
            description="Active learning paths"
            icon={<BookOpen className="h-5 w-5 text-blue-600" />}
            color="blue"
          />
          <StatCard
            title="Courses Completed"
            value={stats.coursesCompleted}
            description="Certificates earned"
            icon={<Trophy className="h-5 w-5 text-yellow-600" />}
            color="orange"
          />
          <StatCard
            title="Current Streak"
            value={`${stats.currentStreak} days`}
            description="Keep it up!"
            icon={<Target className="h-5 w-5 text-green-600" />}
            color="green"
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Overall Progress"
            value={`${stats.overallProgress}%`}
            description="Across all courses"
            icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
            color="purple"
            trend={{ value: 8.3, isPositive: true }}
          />
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Continue Learning */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PlayCircle className="h-5 w-5 mr-2 text-blue-600" />
                      Continue Learning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                        {enrolledCourses.slice(0, 1).map((course) => (
                        <Link key={course.id} href={`/student/courses/${course.id}`}>
                          <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{course.title}</h3>
                                <p className="text-sm text-gray-600">Continue your learning journey</p>
                                <div className="flex items-center mt-1">
                                  <Progress value={course.progress} className="w-32 h-2 mr-2" />
                                  <span className="text-xs text-gray-500">{course.progress}% complete</span>
                                </div>
                              </div>
                            </div>
                            <Button>
                              <Play className="h-4 w-4 mr-2" />
                              Continue
                            </Button>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentActivity.map((activity) => (
                      <ActivityItem
                        key={activity.id}
                        type={activity.type}
                        message={activity.message}
                        time={activity.time}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Upcoming Deadlines */}
                <Card className="border-orange-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-orange-600" />
                      Upcoming Deadlines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {upcomingDeadlines.map((deadline) => (
                          <Link key={deadline.id} href={`/exam/${deadline.slug}`}>
                            <div 
                              className={`p-3 rounded-lg border-l-4 hover:bg-opacity-80 transition-colors cursor-pointer ${getPriorityColor(deadline.priority)}`}
                            >
                              <p className="font-medium text-sm">{deadline.title}</p>
                              <p className="text-xs text-gray-600">{deadline.course}</p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-500">{deadline.dueDate}</p>
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      deadline.priority === 'high' ? 'border-red-200 text-red-700' :
                                      deadline.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                                      'border-green-200 text-green-700'
                                    }`}
                                  >
                                    {deadline.priority}
                                  </Badge>
                                  <ChevronRight className="h-3 w-3 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Recommended Courses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Star className="h-5 w-5 mr-2 text-yellow-600" />
                      Recommended for You
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recommendedCourses.map((course) => (
                      <div key={course.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{course.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{course.instructor}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <div className="flex items-center">
                                <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                <span className="text-xs">{course.rating}</span>
                              </div>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">{course.students} students</span>
                            </div>
                            <Badge className={`mt-2 text-xs ${getDifficultyColor(course.difficulty)}`}>
                              {course.difficulty}
                            </Badge>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">My Courses</h2>
              <Button>
                <BookOpen className="h-4 w-4 mr-2" />
                Browse More Courses
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <div key={course.id} className="group">
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Badge className={`text-xs ${getDifficultyColor(course.difficulty)}`}>
                          {course.difficulty}
                        </Badge>
                        <div className="flex items-center">
                          <Star className="h-3 w-3 text-yellow-500 mr-1" />
                          <span className="text-xs">{course.rating}</span>
                        </div>
                      </div>
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {course.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{course.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{course.instructor}</span>
                        <Badge 
                          variant={course.status === 'completed' ? 'default' : 'secondary'}
                          className={course.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {course.status === 'completed' ? 
                            <CheckCircle className="h-3 w-3 mr-1" /> : 
                            <Clock className="h-3 w-3 mr-1" />
                          }
                          {course.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                          <span>{course.nextDeadline}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
                        <Link href={`/student/courses/${course.id}`}>
                          <Button size="sm" className="flex-1">
                            <Play className="h-4 w-4 mr-2" />
                            {course.status === 'completed' ? 'Review' : 'Continue'}
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <h2 className="text-xl font-semibold">Learning Progress</h2>
            
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {enrolledCourses.map((course) => (
                      <div key={course.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{course.title}</span>
                          <span className="text-gray-600">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                          <span className={course.status === 'completed' ? 'text-green-600' : 'text-blue-600'}>
                            {course.status === 'completed' ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Learning Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.currentStreak}</div>
                      <div className="text-sm text-blue-700">Day Streak</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.coursesCompleted}</div>
                      <div className="text-sm text-green-700">Completed</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Weekly Goal</span>
                      <span className="text-sm text-gray-600">4/5 hours</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Monthly Goal</span>
                      <span className="text-sm text-gray-600">12/20 hours</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <h2 className="text-xl font-semibold">Achievements & Badges</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {achievements.map((achievement) => (
                <Card 
                  key={achievement.id} 
                  className={`text-center ${achievement.earned ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}
                >
                  <CardContent className="pt-6">
                    <div className={`text-4xl mb-3 ${achievement.earned ? '' : 'grayscale'}`}>
                      {achievement.icon}
                    </div>
                    <h3 className="font-semibold mb-2">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                    <Badge 
                      variant={achievement.earned ? 'default' : 'secondary'}
                      className={achievement.earned ? 'bg-yellow-100 text-yellow-800' : ''}
                    >
                      {achievement.earned ? 'Earned' : 'Locked'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                  Progress Towards Next Achievement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Problem Solver</span>
                      <span className="text-gray-600">78/100 problems solved</span>
                    </div>
                    <Progress value={78} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">22 more coding problems to unlock this achievement</p>
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
