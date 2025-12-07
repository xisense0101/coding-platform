import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createAdminClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

// GET /api/admin/users/:userId - Get detailed user information
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
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
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const userId = params.userId

    // Get user details
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', userProfile.organization_id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get additional data based on role
    let additionalData: any = {}

    if (targetUser.role === 'student') {
      // Get enrollments and exam submissions
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses:course_id (
            id,
            title,
            slug,
            thumbnail_url
          )
        `)
        .eq('student_id', userId)
        .order('enrollment_date', { ascending: false })
      
      if (enrollError) {
        logger.error('Error fetching enrollments:', enrollError)
      }

      const { data: submissions, error: submError } = await supabase
        .from('exam_submissions')
        .select(`
          *,
          exams:exam_id (
            id,
            title,
            slug,
            total_marks
          )
        `)
        .eq('student_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(10)
      
      if (submError) {
        logger.error('Error fetching submissions:', submError)
      }

      additionalData = {
        enrollments: enrollments || [],
        recentSubmissions: submissions || [],
        totalEnrollments: enrollments?.length || 0,
        totalSubmissions: submissions?.length || 0
      }
    } else if (targetUser.role === 'teacher') {
      // Get courses created by teacher
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', userId)
        .order('created_at', { ascending: false })
      
      if (coursesError) {
        logger.error('Error fetching courses:', coursesError)
      }

      // Get exams created by teacher
      const { data: exams, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('teacher_id', userId)
        .order('created_at', { ascending: false })
      
      if (examsError) {
        logger.error('Error fetching exams:', examsError)
      }

      // Count enrollments in teacher's courses
      const { count: totalStudents, error: studentsError } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .in('course_id', courses?.map(c => c.id) || [])
      
      if (studentsError) {
        logger.error('Error counting students:', studentsError)
      }

      additionalData = {
        courses: courses || [],
        exams: exams || [],
        totalCourses: courses?.length || 0,
        totalExams: exams?.length || 0,
        totalStudents: totalStudents || 0
      }
    }

    // Get login history
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      user: targetUser,
      ...additionalData,
      recentSessions: sessions || []
    }, { status: 200 })

  } catch (error) {
    logger.error('Admin get user API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/users/:userId - Update user (suspend, activate, delete)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
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
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const userId = params.userId
    const body = await request.json()
    const { action, ...updateData } = body

    // Prevent admin from modifying themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own account' },
        { status: 400 }
      )
    }

    // Get target user
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', userProfile.organization_id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent modifying super_admin unless current user is super_admin
    if (targetUser.role === 'super_admin' && userProfile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot modify super admin account' },
        { status: 403 }
      )
    }

    let updates: any = {}

    if (action === 'suspend') {
      updates.is_active = false
    } else if (action === 'activate') {
      updates.is_active = true
    } else {
      // Allow updating other fields
      if (updateData.full_name) updates.full_name = updateData.full_name
      if (updateData.email) updates.email = updateData.email
      if (updateData.student_id) updates.student_id = updateData.student_id
      if (updateData.employee_id) updates.employee_id = updateData.employee_id
      if (updateData.department) updates.department = updateData.department
      if (updateData.specialization) updates.specialization = [updateData.specialization]
    }

    updates.updated_at = new Date().toISOString()

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating user:', updateError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    }, { status: 200 })

  } catch (error) {
    logger.error('Admin update user API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/users/:userId - Delete user permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
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
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || !['admin', 'super_admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const userId = params.userId

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Get target user
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', userProfile.organization_id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting super_admin unless current user is super_admin
    if (targetUser.role === 'super_admin' && userProfile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot delete super admin account' },
        { status: 403 }
      )
    }

    // Force delete user and handle all dependencies
    // Delete or nullify all associated content before deleting the user
    
    try {
      // Delete questions created by this user (or nullify created_by if you want to keep them)
      await supabase
        .from('questions')
        .delete()
        .eq('created_by', userId)

      // For teachers: Delete their courses and exams
      if (targetUser.role === 'teacher') {
        // Delete exams first (they reference courses)
        await supabase
          .from('exams')
          .delete()
          .eq('teacher_id', userId)

        // Delete courses
        await supabase
          .from('courses')
          .delete()
          .eq('teacher_id', userId)
      }

      // For students: Delete their enrollments and submissions
      if (targetUser.role === 'student') {
        // Delete exam submissions
        await supabase
          .from('exam_submissions')
          .delete()
          .eq('student_id', userId)

        // Delete course enrollments
        await supabase
          .from('course_enrollments')
          .delete()
          .eq('student_id', userId)
      }

      // Delete user sessions
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)

      // Delete password reset tokens
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('user_id', userId)

      // Delete email verification tokens
      await supabase
        .from('email_verification_tokens')
        .delete()
        .eq('user_id', userId)

    } catch (cleanupError: any) {
      logger.error('Error cleaning up user data:', cleanupError)
      // Continue with deletion anyway
    }

    // CRITICAL: Delete auth user FIRST before database user
    // This prevents orphaned auth users that can't be re-registered
    logger.info(`Attempting to delete auth user: ${userId}`)
    
    const adminClient = createAdminClient()
    const { data: authDeleteData, error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId)
    
    if (authDeleteError) {
      logger.error('Failed to delete auth user:', {
        error: authDeleteError,
        message: authDeleteError.message,
        status: authDeleteError.status,
        userId: userId
      })
      
      // If user doesn't exist in auth, that's actually OK - proceed with database deletion
      if (authDeleteError.status === 404 || authDeleteError.message?.includes('not found')) {
        logger.warn(`Auth user ${userId} not found, but continuing with database deletion`)
      } else {
        return NextResponse.json({ 
          error: 'Failed to delete user from authentication system',
          message: authDeleteError.message || 'Unable to remove user from authentication. Please try again or contact support.',
          details: authDeleteError
        }, { status: 500 })
      }
    }

    logger.info(`Auth user deleted successfully: ${userId}`)

    // Now delete the user from database (only after auth deletion succeeds)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      logger.error('Error deleting user from database:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete user from database',
        message: deleteError.message || 'An error occurred while deleting the user from database'
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'User deleted successfully'
    }, { status: 200 })

  } catch (error) {
    logger.error('Admin delete user API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
