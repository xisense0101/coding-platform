import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

import { logger } from '@/lib/utils/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user is a student
    if (userProfile.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can enroll in courses' },
        { status: 403 }
      )
    }

    // Check if course exists and is published
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, is_published, organization_id')
      .eq('id', params.courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (!course.is_published) {
      return NextResponse.json(
        { error: 'Course is not published' },
        { status: 400 }
      )
    }

    // Check if student is in the same organization
    if (course.organization_id !== userProfile.organization_id) {
      return NextResponse.json(
        { error: 'You can only enroll in courses from your organization' },
        { status: 403 }
      )
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', params.courseId)
      .single()

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      )
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .insert({
        student_id: user.id,
        course_id: params.courseId,
        enrollment_date: new Date().toISOString(),
        progress_percentage: 0,
        is_active: true
      })
      .select()
      .single()

    if (enrollmentError) {
      logger.error('Error creating enrollment:', enrollmentError)
      return NextResponse.json(
        { error: 'Failed to enroll in course' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('analytics_events')
      .insert({
        organization_id: userProfile.organization_id,
        user_id: user.id,
        event_type: 'course_enrolled',
        event_category: 'course_management',
        event_data: {
          course_id: params.courseId,
          enrollment_id: enrollment.id
        }
      })

    return NextResponse.json({
      success: true,
      enrollment
    })

  } catch (error) {
    logger.error('Error in enrollment API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Unenroll from course
    const { error: deleteError } = await supabase
      .from('course_enrollments')
      .delete()
      .eq('student_id', user.id)
      .eq('course_id', params.courseId)

    if (deleteError) {
      logger.error('Error removing enrollment:', deleteError)
      return NextResponse.json(
        { error: 'Failed to unenroll from course' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unenrolled from course'
    })

  } catch (error) {
    logger.error('Error in unenrollment API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
