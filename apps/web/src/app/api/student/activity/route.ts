import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'
import { formatRelativeTime } from '@/lib/utils'

// GET /api/student/activity - Get student activity and upcoming deadlines
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id, role, last_activity')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get enrolled courses for context
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_id, last_accessed, updated_at')
      .eq('student_id', user.id)
      .eq('is_active', true)
      .order('last_accessed', { ascending: false })
      .limit(5)

    // Get upcoming exams
    const now = new Date().toISOString()
    const { data: upcomingExams } = await supabase
      .from('exams')
      .select(`
        id,
        title,
        slug,
        start_time,
        end_time,
        duration_minutes,
        total_marks,
        course_id,
        courses!exams_course_id_fkey(title)
      `)
      .eq('organization_id', userProfile.organization_id)
      .eq('is_published', true)
      .gte('end_time', now)
      .order('start_time', { ascending: true })
      .limit(10) as { data: Array<{
        id: string
        title: string
        slug: string
        start_time: string
        end_time: string
        duration_minutes: number
        total_marks: number
        course_id: string
        courses: { title: string } | null
      }> | null }

    // Get recent exam submissions
    const { data: recentSubmissions } = await supabase
      .from('exam_submissions')
      .select(`
        id,
        created_at,
        submitted_at,
        exam_id,
        exams!exam_submissions_exam_id_fkey(title, slug)
      `)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5) as { data: Array<{
        id: string
        created_at: string
        submitted_at: string | null
        exam_id: string
        exams: { title: string; slug: string } | null
      }> | null }

    // Format activity items
    const recentActivity: Array<{
      type: 'course' | 'exam' | 'student'
      message: string
      time: string
    }> = []

    // Add recent course accesses
    if (enrollments && enrollments.length > 0) {
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', enrollments.map(e => e.course_id))
      
      const courseMap = new Map(courses?.map(c => [c.id, c.title]) || [])
      
      enrollments.forEach(enrollment => {
        if (enrollment.last_accessed) {
          recentActivity.push({
            type: 'course' as const,
            message: `Continued learning in ${courseMap.get(enrollment.course_id) || 'Course'}`,
            time: formatRelativeTime(new Date(enrollment.last_accessed))
          })
        }
      })
    }

    // Add recent submissions
    if (recentSubmissions) {
      recentSubmissions.forEach(submission => {
        const examTitle = submission.exams?.title || 'Exam'
        const time = submission.submitted_at || submission.created_at
        recentActivity.push({
          type: 'exam' as const,
          message: submission.submitted_at 
            ? `Completed ${examTitle}` 
            : `Started ${examTitle}`,
          time: formatRelativeTime(new Date(time))
        })
      })
    }

    // Sort by most recent
    recentActivity.sort((a, b) => {
      // This is a simplified sort - in production you'd keep timestamps
      return 0
    })

    // Format upcoming deadlines
    const upcomingDeadlines = upcomingExams?.map(exam => {
      const startTime = new Date(exam.start_time)
      const endTime = new Date(exam.end_time)
      const now = new Date()
      const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      let priority: 'high' | 'medium' | 'low' = 'low'
      if (hoursUntilStart < 24) priority = 'high'
      else if (hoursUntilStart < 72) priority = 'medium'

      return {
        id: exam.id,
        title: exam.title,
        course: exam.courses?.title || 'Course',
        dueDate: endTime.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        priority,
        slug: exam.slug
      }
    }) || []

    // Calculate streak (simplified - would need more sophisticated tracking)
    const currentStreak = calculateStreak(enrollments || [])

    return NextResponse.json({
      recentActivity: recentActivity.slice(0, 5),
      upcomingDeadlines: upcomingDeadlines.slice(0, 5),
      currentStreak
    }, { status: 200 })

  } catch (error) {
    logger.error('Student activity API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateStreak(enrollments: any[]): number {
  // Simplified streak calculation
  // In production, you'd track daily logins in a separate table
  const uniqueDays = new Set(
    enrollments
      .filter(e => e.last_accessed)
      .map(e => new Date(e.last_accessed).toDateString())
  )
  return Math.min(uniqueDays.size, 30) // Cap at 30 for now
}
