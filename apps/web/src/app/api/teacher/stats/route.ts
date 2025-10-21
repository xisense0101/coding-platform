import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getCached, invalidateCache, CacheKeys, CacheTTL } from '@/lib/redis/client'
import { logger } from '@/lib/utils/logger'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET /api/teacher/stats - Get comprehensive teacher statistics (OPTIMIZED with caching)
export const GET = withAuth(
  async (request: NextRequest, { user, userProfile, supabase }) => {
    try {
      // Use cached stats with 5-minute TTL
      const stats = await getCached(
        CacheKeys.teacherStats(user.id),
        async () => {
          // Get all courses by this teacher
          const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('id, is_published')
            .eq('teacher_id', user.id)
            .eq('organization_id', userProfile.organization_id)

          if (coursesError) {
            logger.error('Error fetching courses:', coursesError)
            throw coursesError
          }

          const courseIds = courses?.map(c => c.id) || []
          const publishedCourses = courses?.filter(c => c.is_published).length || 0

          // Parallel fetch for better performance
          const [enrollmentsResult, examsResult, submissionsResult] = await Promise.all([
            // Get total students across all courses
            supabase
              .from('course_enrollments')
              .select('student_id, course_id')
              .in('course_id', courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])
              .eq('is_active', true),
            
            // Get all exams by this teacher
            supabase
              .from('exams')
              .select('id, is_published, start_time, end_time')
              .eq('teacher_id', user.id)
              .eq('organization_id', userProfile.organization_id),
            
            // Get exam submissions - fetch after we have exam IDs
            Promise.resolve({ data: null, error: null })
          ])

          const { data: enrollments, error: enrollmentsError } = enrollmentsResult
          const { data: exams, error: examsError } = examsResult

          if (enrollmentsError) {
            logger.error('Error fetching enrollments:', enrollmentsError)
          }
          if (examsError) {
            logger.error('Error fetching exams:', examsError)
          }

          // Count unique students
          const uniqueStudents = new Set(enrollments?.map(e => e.student_id) || [])
          const totalStudents = uniqueStudents.size

          const now = new Date()
          const activeExams = exams?.filter(exam => {
            const startTime = exam.start_time ? new Date(exam.start_time) : new Date(0)
            const endTime = exam.end_time ? new Date(exam.end_time) : new Date()
            return exam.is_published && startTime <= now && now <= endTime
          }).length || 0

          // Get exam submissions for all teacher's exams
          const examIds = exams?.map(e => e.id) || []
          const { data: submissions, error: submissionsError } = await supabase
            .from('exam_submissions')
            .select('total_score, max_score, submission_status')
            .in('exam_id', examIds.length > 0 ? examIds : ['00000000-0000-0000-0000-000000000000'])
            .eq('submission_status', 'graded')

          if (submissionsError) {
            logger.error('Error fetching submissions:', submissionsError)
          }

          // Calculate average score percentage
          let averageScore = 0
          if (submissions && submissions.length > 0) {
            const totalPercentages = submissions.reduce((sum, sub) => {
              if (sub.max_score && sub.max_score > 0) {
                return sum + ((sub.total_score || 0) / sub.max_score) * 100
              }
              return sum
            }, 0)
            averageScore = Math.round(totalPercentages / submissions.length)
          }

          // Get course-specific statistics (OPTIMIZED: single query per course)
          const courseStats = await Promise.all(
            courseIds.map(async (courseId) => {
              const { data: courseEnrollments } = await supabase
                .from('course_enrollments')
                .select('progress_percentage, completion_date')
                .eq('course_id', courseId)
                .eq('is_active', true)

              const studentCount = courseEnrollments?.length || 0
              const avgProgress = courseEnrollments && courseEnrollments.length > 0
                ? Math.round(courseEnrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / courseEnrollments.length)
                : 0
              
              const completionCount = courseEnrollments?.filter(e => e.completion_date).length || 0

              return {
                courseId,
                studentCount,
                avgProgress,
                completionCount
              }
            })
          )

          return {
            totalCourses: courses?.length || 0,
            publishedCourses,
            totalStudents,
            totalExams: exams?.length || 0,
            activeExams,
            averageScore,
            courseStats
          }
        },
        CacheTTL.medium // 5 minutes cache
      )

      return NextResponse.json(stats, { status: 200 })

    } catch (error) {
      logger.error('Teacher stats API error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  },
  { requireRole: 'teacher', cacheProfile: true }
)
