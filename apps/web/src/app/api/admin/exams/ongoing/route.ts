import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

// GET /api/admin/exams/ongoing - Get all currently active/ongoing exams
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile and check admin role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      logger.error('Profile error or unauthorized:', profileError, userProfile)
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // If user has no organization, return empty results
    if (!userProfile.organization_id) {
      logger.warn('User has no organization_id:', user.id)
      return NextResponse.json({
        exams: [],
        total: 0,
        message: 'No organization assigned to user'
      }, { status: 200 })
    }

    const now = new Date().toISOString()

    // Get ongoing exams (started but not ended, and published)
    let query = supabase
      .from('exams')
      .select(`
        *,
        teacher:teacher_id (
          id,
          full_name,
          email
        ),
        courses:course_id (
          id,
          title,
          slug
        )
      `)
      .eq('is_published', true)
      .lte('start_time', now)
      .gte('end_time', now)
      .order('start_time', { ascending: false })

    // Only filter by organization if it exists (some setups might not have this field yet)
    if (userProfile.organization_id) {
      query = query.eq('organization_id', userProfile.organization_id)
    }

    const { data: ongoingExams, error: examsError } = await query

    if (examsError) {
      logger.error('Error fetching ongoing exams:', examsError)
      return NextResponse.json({ 
        error: 'Failed to fetch ongoing exams',
        details: examsError.message 
      }, { status: 500 })
    }

    // For each exam, get active submissions count
    const examsWithStats = await Promise.all(
      (ongoingExams || []).map(async (exam) => {
        try {
          // Get total active submissions
          const { count: activeSubmissions, error: activeError } = await supabase
            .from('exam_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id)
            .in('submission_status', ['in_progress', 'submitted'])

          if (activeError) {
            logger.error('Error fetching active submissions:', activeError)
          }

          // Get submissions for this exam
          const { data: examSubmissions, error: submError } = await supabase
            .from('exam_submissions')
            .select('id')
            .eq('exam_id', exam.id)

          if (submError) {
            logger.error('Error fetching exam submissions:', submError)
          }

          const submissionIds = examSubmissions?.map(s => s.id) || []

          // Get students with violations (only if there are submissions)
          let studentsWithViolations = 0
          if (submissionIds.length > 0) {
            const { count: violationsCount, error: violationsError } = await supabase
              .from('exam_violations')
              .select('submission_id', { count: 'exact', head: true })
              .in('submission_id', submissionIds)

            if (violationsError) {
              logger.error('Error fetching violations:', violationsError)
            } else {
              studentsWithViolations = violationsCount || 0
            }
          }

          // Get completed submissions
          const { count: completedSubmissions, error: completedError } = await supabase
            .from('exam_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id)
            .eq('submission_status', 'graded')

          if (completedError) {
            logger.error('Error fetching completed submissions:', completedError)
          }

          // Calculate time remaining
          const endTime = new Date(exam.end_time)
          const currentTime = new Date()
          const timeRemainingMinutes = Math.max(0, Math.floor((endTime.getTime() - currentTime.getTime()) / 60000))

          return {
            ...exam,
            stats: {
              activeSubmissions: activeSubmissions || 0,
              completedSubmissions: completedSubmissions || 0,
              studentsWithViolations: studentsWithViolations,
              timeRemainingMinutes
            }
          }
        } catch (examError) {
          logger.error('Error processing exam stats:', examError, 'for exam:', exam.id)
          // Return exam with zero stats if there's an error
          return {
            ...exam,
            stats: {
              activeSubmissions: 0,
              completedSubmissions: 0,
              studentsWithViolations: 0,
              timeRemainingMinutes: 0
            }
          }
        }
      })
    )

    return NextResponse.json({
      exams: examsWithStats,
      total: examsWithStats.length
    }, { status: 200 })

  } catch (error: any) {
    logger.error('Admin ongoing exams API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message || 'Unknown error',
      details: error.toString()
    }, { status: 500 })
  }
}
