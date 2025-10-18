"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Filter, 
  BookOpen, 
  Users, 
  Clock, 
  Star,
  ChevronRight,
  User,
  Calendar
} from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'

import { logger } from '@/lib/utils/logger'

interface Course {
  id: string
  title: string
  description: string
  teacher_id: string
  difficulty_level: string
  estimated_hours: number
  is_published: boolean
  created_at: string
  users: {
    full_name: string
    profile_image_url?: string
  }
}

export default function CoursesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("")
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null)

  useEffect(() => {
    fetchCourses()
    if (user?.role === 'student') {
      fetchEnrolledCourses()
    }
  }, [user])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/courses?published=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      } else {
        logger.error('Failed to fetch courses:', response.status)
      }
    } catch (error) {
      logger.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrolledCourses = async () => {
    try {
      const response = await fetch('/api/courses?my_courses=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const enrolledIds = data.courses?.map((course: Course) => course.id) || []
        setEnrolledCourses(enrolledIds)
      }
    } catch (error) {
      logger.error('Error fetching enrolled courses:', error)
    }
  }

  const handleEnroll = async (courseId: string) => {
    if (!user || user.role !== 'student') {
      alert('Only students can enroll in courses')
      return
    }

    try {
      setEnrollingCourseId(courseId)
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setEnrolledCourses([...enrolledCourses, courseId])
        alert('Successfully enrolled in course!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to enroll in course')
      }
    } catch (error) {
      logger.error('Error enrolling in course:', error)
      alert('Failed to enroll in course')
    } finally {
      setEnrollingCourseId(null)
    }
  }

  const handleViewCourse = (courseId: string) => {
    if (user?.role === 'student' && enrolledCourses.includes(courseId)) {
      router.push(`/student/courses/${courseId}`)
    } else if (user?.role === 'teacher') {
      router.push(`/teacher/courses/${courseId}`)
    } else {
      // Not enrolled, show course details
      router.push(`/courses/${courseId}`)
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDifficulty = !selectedDifficulty || course.difficulty_level === selectedDifficulty
    return matchesSearch && matchesDifficulty
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading courses...</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Explore Courses
          </h1>
          <p className="text-gray-600">
            Discover and enroll in courses to enhance your skills
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Courses</TabsTrigger>
            {user?.role === 'student' && <TabsTrigger value="enrolled">My Courses</TabsTrigger>}
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="border-blue-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <Badge className={getDifficultyColor(course.difficulty_level)}>
                        {course.difficulty_level}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {course.description || 'No description available'}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{course.users?.full_name || 'Unknown'}</span>
                      </div>
                      {course.estimated_hours > 0 && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{course.estimated_hours}h</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>Created {new Date(course.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCourse(course.id)}
                      >
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      
                      {user?.role === 'student' && (
                        enrolledCourses.includes(course.id) ? (
                          <Badge className="bg-green-100 text-green-800">
                            Enrolled
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleEnroll(course.id)}
                            disabled={enrollingCourseId === course.id}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {enrollingCourseId === course.id ? (
                              <>
                                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                                Enrolling...
                              </>
                            ) : (
                              'Enroll'
                            )}
                          </Button>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                    <p className="text-gray-500">
                      {searchTerm || selectedDifficulty 
                        ? 'Try adjusting your search criteria'
                        : 'No courses are available at the moment'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {user?.role === 'student' && (
            <TabsContent value="enrolled" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses
                  .filter(course => enrolledCourses.includes(course.id))
                  .map((course) => (
                    <Card key={course.id} className="border-green-200 hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <Badge className="bg-green-100 text-green-800">
                            Enrolled
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {course.description || 'No description available'}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => router.push(`/student/courses/${course.id}`)}
                        >
                          Continue Learning
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              {enrolledCourses.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No enrolled courses</h3>
                      <p className="text-gray-500 mb-4">
                        You haven't enrolled in any courses yet. Browse available courses to get started.
                      </p>
                      <Button onClick={() => setSearchTerm('')}>
                        Browse Courses
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
