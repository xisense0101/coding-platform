import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createAdminClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

// GET /api/admin/organizations/[orgId]/users/[userId] - Get specific user details for organization
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string; userId: string } }
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

    const { orgId, userId } = params

    // Get target user and verify they belong to this organization
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', orgId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found in this organization' }, { status: 404 })
    }

    // Get role-specific data
    let roleData: any = {}

    if (targetUser.role === 'student') {
      // Get enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          id,
          enrollment_date,
          course:course_id (
            id,
            title
          )
        `)
        .eq('student_id', userId)
        .order('enrollment_date', { ascending: false })

      // Get exam submissions
      const { data: submissions } = await supabase
        .from('exam_submissions')
        .select(`
          id,
          status,
          score,
          max_score,
          submitted_at,
          exam:exam_id (
            id,
            title
          )
        `)
        .eq('student_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(10)

      roleData = {
        enrollments: enrollments || [],
        recentSubmissions: submissions || []
      }
    } else if (targetUser.role === 'teacher') {
      // Get courses created
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, description, is_published, created_at')
        .eq('teacher_id', userId)
        .order('created_at', { ascending: false })

      // Get exams created
      const { data: exams } = await supabase
        .from('exams')
        .select('id, title, start_time, end_time, is_published, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      // Count students across all courses
      const { count: totalStudents } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .in('course_id', courses?.map(c => c.id) || [])

      roleData = {
        courses: courses || [],
        exams: exams || [],
        totalStudents: totalStudents || 0
      }
    }

    // Get login sessions
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, ip_address, user_agent, created_at, last_active')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      user: targetUser,
      roleData,
      sessions: sessions || []
    })
  } catch (error) {
    logger.error('Error fetching user details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/organizations/[orgId]/users/[userId] - Update user (suspend/activate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orgId: string; userId: string } }
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

    const { orgId, userId } = params
    const body = await request.json()
    const { action } = body

    // Verify user belongs to this organization
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', orgId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found in this organization' }, { status: 404 })
    }

    // Prevent modifying super_admin unless current user is super_admin
    if (targetUser.role === 'super_admin' && userProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Cannot modify super admin users' }, { status: 403 })
    }

    // Handle suspend/activate action
    if (action === 'suspend' || action === 'activate') {
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_active: action === 'activate' })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({
        message: `User ${action === 'suspend' ? 'suspended' : 'activated'} successfully`
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    logger.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/organizations/[orgId]/users/[userId] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orgId: string; userId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    const adminClient = createAdminClient()
    
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

    const { orgId, userId } = params

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Verify user belongs to this organization
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', orgId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found in this organization' }, { status: 404 })
    }

    // Prevent deleting super_admin unless current user is super_admin
    if (targetUser.role === 'super_admin' && userProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Cannot delete super admin users' }, { status: 403 })
    }

    logger.info(`Starting cascade deletion for user ${userId}`)

    // Step 1: Delete questions created by this user
    const { error: questionsError } = await supabase
      .from('questions')
      .delete()
      .eq('created_by', userId)

    if (questionsError) {
      logger.error('Error deleting questions:', questionsError)
    }

    // Step 2: Delete courses created by this user (if teacher)
    const { error: coursesError } = await supabase
      .from('courses')
      .delete()
      .eq('teacher_id', userId)

    if (coursesError) {
      logger.error('Error deleting courses:', coursesError)
    }

    // Step 3: Delete exams created by this user
    const { error: examsError } = await supabase
      .from('exams')
      .delete()
      .eq('created_by', userId)

    if (examsError) {
      logger.error('Error deleting exams:', examsError)
    }

    // Step 4: Delete enrollments
    const { error: enrollmentsError } = await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', userId)

    if (enrollmentsError) {
      logger.error('Error deleting enrollments:', enrollmentsError)
    }

    // Step 5: Delete exam submissions
    const { error: submissionsError } = await supabase
      .from('exam_submissions')
      .delete()
      .eq('student_id', userId)

    if (submissionsError) {
      logger.error('Error deleting submissions:', submissionsError)
    }

    // Step 6: Delete sessions
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId)

    if (sessionsError) {
      logger.error('Error deleting sessions:', sessionsError)
    }

    // Step 7: CRITICAL - Delete auth user FIRST before database user
    // This prevents orphaned auth users that can't be re-registered
    logger.info(`Attempting to delete auth user: ${userId}`)
    
    const { data: authDeleteData, error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      logger.error('Error deleting auth user:', {
        error: authDeleteError,
        message: authDeleteError.message,
        status: authDeleteError.status,
        userId: userId
      })
      
      // If user doesn't exist in auth, that's actually OK - proceed with database deletion
      if (authDeleteError.status === 404 || authDeleteError.message?.includes('not found')) {
        logger.warn(`Auth user ${userId} not found, but continuing with database deletion`)
      } else {
        return NextResponse.json(
          { 
            error: 'Failed to delete user from authentication system',
            message: authDeleteError.message || 'Unable to remove user from authentication',
            details: authDeleteError
          },
          { status: 500 }
        )
      }
    }

    logger.info(`Auth user deleted successfully: ${userId}`)

    // Step 8: Delete user profile (only after auth deletion succeeds)
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (userDeleteError) {
      logger.error('Error deleting user profile:', userDeleteError)
      return NextResponse.json(
        { 
          error: 'Failed to delete user from database',
          message: userDeleteError.message || 'An error occurred while deleting user profile'
        },
        { status: 500 }
      )
    }

    logger.info(`Successfully deleted user ${userId} and all associated content`)

    return NextResponse.json({
      message: 'User and all associated content deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
