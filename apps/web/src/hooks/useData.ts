import { useState, useEffect } from 'react'
import { createClient } from '@/lib/database/client'
import type { Database } from '@/lib/database/types'
import { useAuth } from '@/lib/auth/AuthContext'

import { logger } from '@/lib/utils/logger'

type Tables = Database['public']['Tables']

// Mock data for development
export const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'student' as const,
  avatar: ''
}

export const mockStudentCourses = [
  {
    id: '1',
    title: 'Introduction to Programming',
    description: 'Learn the basics of programming',
    progress: 75,
    totalLessons: 20,
    completedLessons: 15,
    instructor: 'Dr. Smith',
    thumbnail: '',
    nextLesson: 'Variables and Data Types'
  },
  {
    id: '2', 
    title: 'Web Development Fundamentals',
    description: 'Build modern web applications',
    progress: 45,
    totalLessons: 25,
    completedLessons: 11,
    instructor: 'Prof. Johnson',
    thumbnail: '',
    nextLesson: 'CSS Flexbox'
  }
]

export function useUser() {
  // Return the database user profile and loading state from AuthContext
  const { userProfile, isLoading } = useAuth()
  return { user: userProfile, loading: isLoading }
}

export function useStudentCourses() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const { userProfile } = useAuth()
  const supabase = createClient()

  // Fetch enrollments joined with course data for the current student
  const fetchEnrollments = async () => {
    if (!userProfile) {
      setCourses([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses!course_enrollments_course_id_fkey(
            id,
            title,
            description,
            cover_image_url,
            teacher:users!courses_teacher_id_fkey(full_name)
          )
        `)
        .eq('student_id', userProfile.id)
        .eq('is_active', true)

      if (error) {
        logger.error('Error fetching student enrollments:', error)
        setCourses([])
        return
      }

      // Map enrollments -> course display model
      const mapped = (data || []).map((enrollment: any) => {
        const course = enrollment.course || {}
        const progress = enrollment.progress_percentage ?? enrollment.progress ?? 0
        const totalLessons = enrollment.total_lessons ?? 20
        return {
          // Use course.id when available, otherwise fall back to the course_id column
          id: course.id || enrollment.course_id || enrollment.id,
          title: course.title || 'Untitled Course',
          description: course.description || '',
          // DB column is progress_percentage
          progress,
          totalLessons,
          completedLessons: Math.round((progress) / 100 * (totalLessons)),
          instructor: course.teacher?.full_name || 'Unknown Instructor',
          thumbnail: course.cover_image_url || '',
          nextLesson: enrollment.next_lesson || ''
        }
      })

      setCourses(mapped)
    } catch (err) {
      logger.error('Unexpected error fetching enrollments:', err)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch when userProfile becomes available
  useEffect(() => {
    fetchEnrollments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.id])

  return { courses, loading, refetch: fetchEnrollments }
}

export function useTeacherCourses() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchCourses()
    }
  }, [user])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/courses?my_courses=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      } else {
        logger.error('Failed to fetch courses:', response.status)
        setCourses([])
      }
    } catch (error) {
      logger.error('Error fetching courses:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }
  
  return { courses, loading, refetch: fetchCourses }
}

export function useTeacherStats() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalExams: 0,
    publishedCourses: 0,
    averageScore: 0
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Fetch courses count
      const coursesResponse = await fetch('/api/courses?my_courses=true', {
        credentials: 'include'
      })
      const coursesData = coursesResponse.ok ? await coursesResponse.json() : { courses: [] }
      
      // Fetch exams count
      const examsResponse = await fetch('/api/exams?my_exams=true', {
        credentials: 'include'
      })
      const examsData = examsResponse.ok ? await examsResponse.json() : { exams: [] }
      
      const totalCourses = coursesData.courses?.length || 0
      const totalExams = examsData.exams?.length || 0
      const publishedCourses = coursesData.courses?.filter((course: any) => course.is_published)?.length || 0
      
      setStats({
        totalCourses,
        totalStudents: 0, // Will need to calculate from enrollments
        totalExams,
        publishedCourses,
        averageScore: 85 // Mock for now
      })
    } catch (error) {
      logger.error('Error fetching teacher stats:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return { stats, loading, refetch: fetchStats }
}

export function useTeacherExams() {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchExams()
    }
  }, [user])

  const fetchExams = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/exams?my_exams=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setExams(data.exams || [])
      } else {
        logger.error('Failed to fetch exams:', response.status)
        setExams([])
      }
    } catch (error) {
      logger.error('Error fetching exams:', error)
      setExams([])
    } finally {
      setLoading(false)
    }
  }
  
  return { exams, loading, refetch: fetchExams }
}

export function useTeacherActivity() {
  const [activities, setActivities] = useState([
    {
      id: '1',
      message: 'New student enrolled in Programming course',
      time: '2 hours ago',
      type: 'student' as const
    },
    {
      id: '2',
      message: 'Quiz submitted by 5 students',
      time: '1 day ago',
      type: 'quiz' as const
    }
  ])
  const [loading, setLoading] = useState(false)
  
  return { activities, loading }
}

export function useData() {
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch courses
  const fetchCourses = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          teacher:users!courses_teacher_id_fkey(full_name)
        `)
        .eq('is_published', true)
      
      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return []
    } finally {
      setLoading(false)
    }
  }

  // Fetch user enrollments
  const fetchEnrollments = async (userId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses!course_enrollments_course_id_fkey(
            id,
            title,
            description,
            cover_image_url,
            teacher:users!courses_teacher_id_fkey(full_name)
          )
        `)
        .eq('student_id', userId)
        .eq('is_active', true)
      
      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return []
    } finally {
      setLoading(false)
    }
  }

  // Fetch course progress
  const fetchCourseProgress = async (userId: string, courseId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('section_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('section_id', courseId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Fetch dashboard statistics
  const fetchDashboardStats = async (userId: string, role: string) => {
    setLoading(true)
    setError(null)
    
    try {
      if (role === 'student') {
        const [enrollmentsData, attemptsData] = await Promise.all([
          supabase.from('course_enrollments').select('*', { count: 'exact' }).eq('student_id', userId),
          supabase.from('attempts').select('*', { count: 'exact' }).eq('user_id', userId)
        ])

        return {
          totalCourses: enrollmentsData.count || 0,
          totalAttempts: attemptsData.count || 0,
          completedCourses: 0, // Will be calculated based on progress
          averageScore: 0 // Will be calculated from attempts
        }
      } else if (role === 'teacher') {
        const [coursesData, studentsData, examsData] = await Promise.all([
          supabase.from('courses').select('*', { count: 'exact' }).eq('teacher_id', userId),
          supabase.from('course_enrollments').select('*, course:courses!course_enrollments_course_id_fkey(id, teacher_id)', { count: 'exact' }).eq('course.teacher_id', userId),
          supabase.from('exams').select('*', { count: 'exact' }).eq('teacher_id', userId)
        ])

        return {
          totalCourses: coursesData.count || 0,
          totalStudents: studentsData.count || 0,
          totalExams: examsData.count || 0,
          publishedCourses: 0 // Will be calculated from courses data
        }
      }

      return {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return {}
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    fetchCourses,
    fetchEnrollments,
    fetchCourseProgress,
    fetchDashboardStats
  }
}
