import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET /api/admin/stats - Get comprehensive admin statistics
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
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userProfile.organization_id)

    // Get users created this month
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const { count: newUsersThisMonth } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userProfile.organization_id)
      .gte('created_at', firstDayOfMonth.toISOString())

    // Get active courses count
    const { count: activeCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userProfile.organization_id)
      .eq('is_published', true)

    // Get courses published this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { count: coursesThisWeek } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userProfile.organization_id)
      .eq('is_published', true)
      .gte('updated_at', oneWeekAgo.toISOString())

    // Get completed exam submissions count
    const { count: completedExams } = await supabase
      .from('exam_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('submission_status', 'graded')

    // Get completed courses (enrollments with completion date)
    const { count: completedCourses } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .not('completion_date', 'is', null)

    // Get active enrollments for daily active users approximation
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { count: dailyActiveUsers } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .gte('last_accessed', yesterday.toISOString())

    // Calculate average session duration (simplified - would need session tracking)
    // For now, use enrollment time data as a proxy
    const { data: enrollmentData } = await supabase
      .from('course_enrollments')
      .select('total_time_spent_minutes')
      .gt('total_time_spent_minutes', 0)
      .limit(100)

    let avgSessionDuration = 24 // Default fallback
    if (enrollmentData && enrollmentData.length > 0) {
      const totalMinutes = enrollmentData.reduce((sum, e) => sum + (e.total_time_spent_minutes || 0), 0)
      avgSessionDuration = Math.round(totalMinutes / enrollmentData.length)
    }

    // Get ongoing exams count
    const currentTime = new Date().toISOString()
    const { count: ongoingExams } = await supabase
      .from('exams')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userProfile.organization_id)
      .eq('is_published', true)
      .lte('start_time', currentTime)
      .gte('end_time', currentTime)

    // Get user counts by role
    const { count: studentCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userProfile.organization_id)
      .eq('role', 'student')
      .eq('is_active', true)

    const { count: teacherCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userProfile.organization_id)
      .eq('role', 'teacher')
      .eq('is_active', true)

    const stats = {
      totalUsers: totalUsers || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
      activeCourses: activeCourses || 0,
      coursesThisWeek: coursesThisWeek || 0,
      completedExams: completedExams || 0,
      completedCourses: completedCourses || 0,
      dailyActiveUsers: dailyActiveUsers || 0,
      avgSessionDuration: avgSessionDuration,
      ongoingExams: ongoingExams || 0,
      activeStudents: studentCount || 0,
      activeTeachers: teacherCount || 0,
      systemUptime: 99.9, // This would come from monitoring service
      securityAlerts: 0 // This would come from security monitoring
    }

    return NextResponse.json(stats, { status: 200 })

  } catch (error) {
    logger.error('Admin stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
