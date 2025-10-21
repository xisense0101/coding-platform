import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

// GET /api/admin/organizations/[orgId]/stats - Get statistics for specific organization
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

    // Get user profile and check super_admin role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 })
    }

    const orgId = params.orgId
    const currentTime = new Date().toISOString()

    // Get all statistics in parallel
    const [
      { count: totalUsers },
      { count: activeStudents },
      { count: activeTeachers },
      { count: suspendedUsers },
      { count: activeCourses },
      { count: totalExams },
      { count: ongoingExams },
      { count: completedExams }
    ] = await Promise.all([
      // Total users
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId),
      
      // Active students
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('role', 'student')
        .eq('is_active', true),
      
      // Active teachers
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('role', 'teacher')
        .eq('is_active', true),
      
      // Suspended users
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_active', false),
      
      // Active courses
      supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_published', true),
      
      // Total exams
      supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId),
      
      // Ongoing exams
      supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_published', true)
        .lte('start_time', currentTime)
        .gte('end_time', currentTime),
      
      // Completed exams
      supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_published', true)
        .lt('end_time', currentTime)
    ])

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeStudents: activeStudents || 0,
      activeTeachers: activeTeachers || 0,
      suspendedUsers: suspendedUsers || 0,
      activeCourses: activeCourses || 0,
      totalExams: totalExams || 0,
      ongoingExams: ongoingExams || 0,
      completedExams: completedExams || 0
    })
  } catch (error) {
    logger.error('Error fetching organization stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
