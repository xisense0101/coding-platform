import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/database/client'
import type { Database } from '@/lib/database/types'
import { useAuth } from '@/lib/auth/AuthContext'
import { logger } from '@/lib/utils/logger'

type Tables = Database['public']['Tables']

// ============================================
// OPTIMIZED CLIENT-SIDE CACHE WITH REQUEST DEDUPLICATION
// ============================================
const clientCache = new Map<string, { data: any; timestamp: number }>()
const pendingRequests = new Map<string, Promise<any>>() // ✅ Prevent duplicate simultaneous requests
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCachedData<T>(key: string): T | null {
  const cached = clientCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T
  }
  if (cached) {
    clientCache.delete(key)
  }
  return null
}

function setCachedData(key: string, data: any): void {
  // ✅ Only log if actually setting new data (prevent duplicate logs)
  const existing = clientCache.get(key)
  if (!existing || existing.data !== data) {
    clientCache.set(key, { data, timestamp: Date.now() })
    logger.log(`💾 Client Cached: ${key}`)
  }
}

// ✅ REQUEST DEDUPLICATION: Prevent multiple identical requests
async function fetchWithDedup<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  // Check if request is already in flight
  if (pendingRequests.has(key)) {
    logger.log(`🔄 Deduped request (already in flight): ${key}`)
    return pendingRequests.get(key)!
  }

  // Start new request
  const promise = fetchFn().finally(() => {
    // Clean up pending request when done
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, promise)
  return promise
}

function invalidateCache(pattern?: string): void {
  if (pattern) {
    Array.from(clientCache.keys()).forEach(key => {
      if (key.includes(pattern)) {
        clientCache.delete(key)
        pendingRequests.delete(key)
      }
    })
  } else {
    clientCache.clear()
    pendingRequests.clear()
  }
}

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

// ============================================
// OPTIMIZED: useUser with memoization
// ============================================
export function useUser() {
  const { userProfile, isLoading } = useAuth()
  
  // ✅ useMemo to prevent unnecessary object recreation
  return useMemo(() => ({ 
    user: userProfile, 
    loading: isLoading 
  }), [userProfile, isLoading])
}

// ============================================
// OPTIMIZED: useStudentCourses with caching
// ============================================
export function useStudentCourses() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const { userProfile } = useAuth()
  
  // ✅ useMemo to create stable supabase client reference
  const supabase = useMemo(() => createClient(), [])

  // ✅ useCallback to prevent function recreation on every render
  const fetchEnrollments = useCallback(async () => {
    if (!userProfile) {
      setCourses([])
      setLoading(false)
      return
    }

    const cacheKey = `student-courses-${userProfile.id}`
    
    // ✅ Check cache first
    const cached = getCachedData<any[]>(cacheKey)
    if (cached) {
      setCourses(cached)
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses!course_enrollments_course_id_fkey(
            id,
            title,
            description,
            cover_image_url,
            teacher:users!courses_teacher_id_fkey(full_name),
            sections:sections!sections_course_id_fkey(
              id,
              questions:questions!questions_section_id_fkey(id)
            )
          )
        `)
        .eq('student_id', userProfile.id)
        .eq('is_active', true)

      if (error) {
        logger.error('Error fetching student enrollments:', error)
        setCourses([])
        return
      }

      // Collect all question IDs to fetch progress
      const allQuestionIds: string[] = []
      const courseQuestionMap = new Map<string, string[]>() // courseId -> questionIds

      enrollments.forEach((enrollment: any) => {
        const courseId = enrollment.course?.id
        if (!courseId) return
        
        const qIds: string[] = []
        enrollment.course.sections?.forEach((section: any) => {
            section.questions?.forEach((q: any) => {
                qIds.push(q.id)
                allQuestionIds.push(q.id)
            })
        })
        courseQuestionMap.set(courseId, qIds)
      })

      // Fetch completed attempts for these questions
      const completedQuestionIds = new Set<string>()
      if (allQuestionIds.length > 0) {
          const { data: attempts, error: attemptsError } = await supabase
            .from('attempts')
            .select('question_id, attempt_type, is_correct, test_cases_passed, total_test_cases')
            .eq('user_id', userProfile.id)
            .in('question_id', allQuestionIds)
            .not('submitted_at', 'is', null)
          
          if (!attemptsError && attempts) {
              attempts.forEach((a: any) => {
                let isCompleted = false;
                if (a.attempt_type === 'mcq') {
                  isCompleted = a.is_correct === true;
                } else if (a.attempt_type === 'coding') {
                  isCompleted = a.test_cases_passed === a.total_test_cases && a.total_test_cases > 0;
                } else {
                  // For other types, submission is enough
                  isCompleted = true;
                }

                if (isCompleted) {
                  completedQuestionIds.add(a.question_id)
                }
              })
          }
      }

      // ✅ Map once and cache the result
      const mapped = (enrollments || []).map((enrollment: any) => {
        const course = enrollment.course || {}
        const courseId = course.id
        const questionIds = courseQuestionMap.get(courseId) || []
        const totalLessons = questionIds.length
        
        const completedLessons = questionIds.filter(qId => completedQuestionIds.has(qId)).length
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

        return {
          id: courseId || enrollment.course_id || enrollment.id,
          title: course.title || 'Untitled Course',
          description: course.description || '',
          progress,
          totalLessons,
          completedLessons,
          instructor: course.teacher?.full_name || 'Unknown Instructor',
          thumbnail: course.cover_image_url || '',
          nextLesson: enrollment.next_lesson || ''
        }
      })

      setCourses(mapped)
      
      // ✅ Cache the mapped result
      setCachedData(cacheKey, mapped)
      
    } catch (err) {
      logger.error('Unexpected error fetching enrollments:', err)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }, [userProfile, supabase])

  useEffect(() => {
    fetchEnrollments()
  }, [fetchEnrollments])

  // ✅ Return memoized object
  return useMemo(() => ({ 
    courses, 
    loading, 
    refetch: fetchEnrollments 
  }), [courses, loading, fetchEnrollments])
}

// ============================================
// OPTIMIZED: useTeacherCourses with caching
// ============================================
export function useTeacherCourses() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchCourses = useCallback(async () => {
    if (!user) return

    const cacheKey = `teacher-courses-${user.id}`
    const cached = getCachedData<any[]>(cacheKey)
    
    if (cached) {
      setCourses(cached)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Pass published=false to fetch both published and draft courses
      const response = await fetch('/api/courses?my_courses=true&published=false', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        const coursesData = data.courses || []
        setCourses(coursesData)
        setCachedData(cacheKey, coursesData)
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
  }, [user])

  useEffect(() => {
    if (user) {
      fetchCourses()
    }
  }, [user, fetchCourses])
  
  return useMemo(() => ({ 
    courses, 
    loading, 
    refetch: fetchCourses 
  }), [courses, loading, fetchCourses])
}

// ============================================
// OPTIMIZED: useTeacherStats with caching
// ============================================
export function useTeacherStats() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalExams: 0,
    publishedCourses: 0,
    activeExams: 0,
    averageScore: 0,
    courseStats: [] as Array<{courseId: string, studentCount: number, avgProgress: number, completionCount: number}>
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchStats = useCallback(async () => {
    if (!user) return

    const cacheKey = `teacher-stats-${user.id}`
    const cached = getCachedData<typeof stats>(cacheKey)
    
    if (cached) {
      setStats(cached)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const statsResponse = await fetch('/api/teacher/stats', {
        credentials: 'include'
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        const newStats = {
          totalCourses: statsData.totalCourses || 0,
          totalStudents: statsData.totalStudents || 0,
          totalExams: statsData.totalExams || 0,
          publishedCourses: statsData.publishedCourses || 0,
          activeExams: statsData.activeExams || 0,
          averageScore: statsData.averageScore || 0,
          courseStats: statsData.courseStats || []
        }
        setStats(newStats)
        setCachedData(cacheKey, newStats)
      } else {
        logger.error('Failed to fetch teacher stats:', statsResponse.status)
      }
    } catch (error) {
      logger.error('Error fetching teacher stats:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user, fetchStats])
  
  return useMemo(() => ({ 
    stats, 
    loading, 
    refetch: fetchStats 
  }), [stats, loading, fetchStats])
}

// ============================================
// OPTIMIZED: useTeacherExams with caching
// ============================================
export function useTeacherExams() {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchExams = useCallback(async () => {
    if (!user) return

    const cacheKey = `teacher-exams-${user.id}`
    const cached = getCachedData<any[]>(cacheKey)
    
    if (cached) {
      setExams(cached)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/exams?my_exams=true', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        const examsData = data.exams || []
        setExams(examsData)
        setCachedData(cacheKey, examsData)
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
  }, [user])

  useEffect(() => {
    if (user) {
      fetchExams()
    }
  }, [user, fetchExams])
  
  return useMemo(() => ({ 
    exams, 
    loading, 
    refetch: fetchExams 
  }), [exams, loading, fetchExams])
}

// ============================================
// OPTIMIZED: useTeacherActivity (minimal changes)
// ============================================
export function useTeacherActivity() {
  const [activities] = useState([
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
  const [loading] = useState(false)
  
  return useMemo(() => ({ activities, loading }), [activities, loading])
}

// ============================================
// OPTIMIZED: useStudentActivity with caching
// ============================================
export function useStudentActivity() {
  const [data, setData] = useState({
    recentActivity: [] as Array<{ type: 'course' | 'exam' | 'student'; message: string; time: string }>,
    upcomingDeadlines: [] as Array<{ id: string; title: string; course: string; dueDate: string; priority: 'high' | 'medium' | 'low'; slug: string }>,
    currentStreak: 0
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchActivity = useCallback(async () => {
    if (!user) return

    const cacheKey = `student-activity-${user.id}`
    const cached = getCachedData<typeof data>(cacheKey)
    
    if (cached) {
      setData(cached)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/student/activity', {
        credentials: 'include'
      })

      if (response.ok) {
        const activityData = await response.json()
        const newData = {
          recentActivity: activityData.recentActivity || [],
          upcomingDeadlines: activityData.upcomingDeadlines || [],
          currentStreak: activityData.currentStreak || 0
        }
        setData(newData)
        setCachedData(cacheKey, newData)
      } else {
        logger.error('Failed to fetch student activity:', response.status)
      }
    } catch (error) {
      logger.error('Error fetching student activity:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchActivity()
    }
  }, [user, fetchActivity])
  
  return useMemo(() => ({ 
    ...data, 
    loading, 
    refetch: fetchActivity 
  }), [data, loading, fetchActivity])
}

// ============================================
// OPTIMIZED: useData with caching
// ============================================
export function useData() {
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ Fetch courses with caching
  const fetchCourses = useCallback(async () => {
    const cacheKey = 'all-courses-published'
    const cached = getCachedData<any[]>(cacheKey)
    
    if (cached) {
      return cached
    }

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
      
      setCachedData(cacheKey, data || [])
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // ✅ Fetch enrollments with caching
  const fetchEnrollments = useCallback(async (userId: string) => {
    const cacheKey = `enrollments-${userId}`
    const cached = getCachedData<any[]>(cacheKey)
    
    if (cached) {
      return cached
    }

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
      
      setCachedData(cacheKey, data || [])
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // ✅ Fetch course progress with caching
  const fetchCourseProgress = useCallback(async (userId: string, courseId: string) => {
    const cacheKey = `progress-${userId}-${courseId}`
    const cached = getCachedData<any>(cacheKey)
    
    if (cached) {
      return cached
    }

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
      
      setCachedData(cacheKey, data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // ✅ Fetch dashboard stats with caching
  const fetchDashboardStats = useCallback(async (userId: string, role: string) => {
    const cacheKey = `dashboard-stats-${userId}-${role}`
    const cached = getCachedData<any>(cacheKey)
    
    if (cached) {
      return cached
    }

    setLoading(true)
    setError(null)
    
    try {
      let stats = {}
      
      if (role === 'student') {
        const [enrollmentsData, attemptsData] = await Promise.all([
          supabase.from('course_enrollments').select('*', { count: 'exact' }).eq('student_id', userId),
          supabase.from('attempts').select('*', { count: 'exact' }).eq('user_id', userId)
        ])

        stats = {
          totalCourses: enrollmentsData.count || 0,
          totalAttempts: attemptsData.count || 0,
          completedCourses: 0,
          averageScore: 0
        }
      } else if (role === 'teacher') {
        const [coursesData, studentsData, examsData] = await Promise.all([
          supabase.from('courses').select('*', { count: 'exact' }).eq('teacher_id', userId),
          supabase.from('course_enrollments').select('*, course:courses!course_enrollments_course_id_fkey(id, teacher_id)', { count: 'exact' }).eq('course.teacher_id', userId),
          supabase.from('exams').select('*', { count: 'exact' }).eq('teacher_id', userId)
        ])

        stats = {
          totalCourses: coursesData.count || 0,
          totalStudents: studentsData.count || 0,
          totalExams: examsData.count || 0,
          publishedCourses: 0
        }
      }

      setCachedData(cacheKey, stats)
      return stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return {}
    } finally {
      setLoading(false)
    }
  }, [supabase])

  return useMemo(() => ({
    loading,
    error,
    fetchCourses,
    fetchEnrollments,
    fetchCourseProgress,
    fetchDashboardStats
  }), [loading, error, fetchCourses, fetchEnrollments, fetchCourseProgress, fetchDashboardStats])
}

export function clearAllCache(): void {
  invalidateCache()
}

export function clearCacheByPattern(pattern: string): void {
  invalidateCache(pattern)
}

export function clearCacheByKey(key: string): void {
  clientCache.delete(key)
  pendingRequests.delete(key)
}
