import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

import { logger } from '@/lib/utils/logger'

const enrollmentSchema = z.object({
  emails: z.array(z.string().email())
})

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

    const body = await request.json()
    const { emails } = enrollmentSchema.parse(body)

    // Verify the user is the teacher of this course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('teacher_id, organization_id')
      .eq('id', params.courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (course.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the course teacher can enroll students' },
        { status: 403 }
      )
    }

    const results = []

    for (const email of emails) {
      try {
        // Find user by email in the same organization
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, role, full_name')
          .eq('email', email.trim())
          .eq('organization_id', course.organization_id)
          .single()

        if (userError || !userData) {
          results.push({
            email,
            success: false,
            error: 'User not found in your organization'
          })
          continue
        }

        // Check if user is a student
        if (userData.role !== 'student') {
          results.push({
            email,
            success: false,
            error: 'User is not a student'
          })
          continue
        }

        // Check if already enrolled
        const { data: existingEnrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('student_id', userData.id)
          .eq('course_id', params.courseId)
          .single()

        if (existingEnrollment) {
          results.push({
            email,
            success: false,
            error: 'Already enrolled',
            studentName: userData.full_name
          })
          continue
        }

        // Create enrollment
        const { error: enrollmentError } = await supabase
          .from('course_enrollments')
          .insert({
            student_id: userData.id,
            course_id: params.courseId,
            enrollment_date: new Date().toISOString(),
            progress_percentage: 0,
            is_active: true
          })

        if (enrollmentError) {
          results.push({
            email,
            success: false,
            error: 'Failed to create enrollment',
            studentName: userData.full_name
          })
        } else {
          results.push({
            email,
            success: true,
            studentName: userData.full_name
          })

          // Log activity
          await supabase
            .from('analytics_events')
            .insert({
              organization_id: course.organization_id,
              user_id: userData.id,
              event_type: 'course_enrolled_by_teacher',
              event_category: 'course_management',
              event_data: {
                course_id: params.courseId,
                enrolled_by: user.id,
                student_email: email
              }
            })
        }

      } catch (error) {
        results.push({
          email,
          success: false,
          error: 'Internal error processing this email'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Enrollment completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: emails.length,
        successful: successCount,
        failed: failureCount
      }
    })

  } catch (error) {
    logger.error('Error in bulk enrollment API:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email format', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
