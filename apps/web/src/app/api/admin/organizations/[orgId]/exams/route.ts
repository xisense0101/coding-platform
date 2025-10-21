import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

// GET /api/admin/organizations/[orgId]/exams - Get exams for specific organization
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
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
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if user has admin access
    const isSuperAdmin = userProfile.role === 'super_admin'
    const isOrgAdmin = userProfile.role === 'admin' && userProfile.organization_id === params.orgId

    if (!isSuperAdmin && !isOrgAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const orgId = params.orgId
    const { searchParams } = new URL(request.url)
    const ongoingOnly = searchParams.get('ongoing') === 'true'

    const now = new Date().toISOString()

    // Build query
    let query = supabase
      .from('exams')
      .select(`
        id,
        title,
        start_time,
        end_time,
        duration_minutes,
        is_published,
        created_at,
        teacher_id,
        course_id
      `)
      .eq('organization_id', orgId)

    // Filter for ongoing exams if requested
    if (ongoingOnly) {
      query = query
        .lte('start_time', now)
        .gte('end_time', now)
        .order('start_time', { ascending: true })
    } else {
      query = query
        .order('created_at', { ascending: false })
        .limit(20)
    }

    const { data: exams, error } = await query

    if (error) {
      throw error
    }

    // If ongoing exams requested, enrich with real-time data
    if (ongoingOnly) {
      const enrichedExams = await Promise.all(
        (exams || []).map(async (exam) => {
          // Calculate time remaining in minutes
          const endTime = new Date(exam.end_time)
          const currentTime = new Date()
          const timeRemainingMs = endTime.getTime() - currentTime.getTime()
          const timeRemainingMinutes = Math.max(0, Math.floor(timeRemainingMs / (1000 * 60)))

          // Get teacher name
          const { data: teacher } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', exam.teacher_id)
            .single()

          // Count active students (students who have started but not submitted)
          const { count: activeStudents } = await supabase
            .from('exam_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id)
            .eq('status', 'in_progress')

          // Count total submissions
          const { count: totalSubmissions } = await supabase
            .from('exam_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id)

          // Count violations
          const { count: violations } = await supabase
            .from('exam_violations')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id)

          return {
            id: exam.id,
            title: exam.title,
            start_time: exam.start_time,
            end_time: exam.end_time,
            duration_minutes: exam.duration_minutes,
            time_remaining: timeRemainingMinutes,
            created_by: exam.teacher_id,
            teacher_name: teacher?.full_name || 'Unknown',
            active_students: activeStudents || 0,
            total_submissions: totalSubmissions || 0,
            violations_count: violations || 0,
            is_published: exam.is_published
          }
        })
      )

      return NextResponse.json({ 
        exams: enrichedExams,
        count: enrichedExams.length
      })
    }

    return NextResponse.json({ exams: exams || [] })
  } catch (error) {
    logger.error('Error fetching organization exams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exams' },
      { status: 500 }
    )
  }
}
