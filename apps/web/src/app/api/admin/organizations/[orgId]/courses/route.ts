import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

// GET /api/admin/organizations/[orgId]/courses - Get courses for specific organization
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

    // Get courses with teacher info - using specific foreign key relationship
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        is_published,
        created_at,
        teacher_id
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    // Fetch teacher names separately to avoid relationship ambiguity
    const coursesWithTeachers = await Promise.all(
      (courses || []).map(async (course) => {
        const { data: teacher } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', course.teacher_id)
          .single()

        return {
          ...course,
          teacher: teacher ? { full_name: teacher.full_name } : null
        }
      })
    )

    return NextResponse.json({ courses: coursesWithTeachers })
  } catch (error) {
    logger.error('Error fetching organization courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
