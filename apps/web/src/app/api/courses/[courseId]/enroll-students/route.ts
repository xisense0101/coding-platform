import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { z } from 'zod'

import { logger } from '@/lib/utils/logger'

const enrollStudentsSchema = z.object({
  emails: z.array(z.string().email('Invalid email format')).min(1, 'At least one email is required')
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

    // Check if user owns this course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('teacher_id, organization_id, title')
      .eq('id', params.courseId)
      .single()

    if (courseError) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (course.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = enrollStudentsSchema.parse(body)

    const results = {
      enrolled: [] as string[],
      alreadyEnrolled: [] as string[],
      notFound: [] as string[],
      errors: [] as string[]
    }

    // Process each email
    for (const email of validatedData.emails) {
      try {
        // Find user by email in the same organization
        const { data: student, error: studentError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('email', email.toLowerCase())
          .eq('organization_id', course.organization_id)
          .single()

        if (studentError || !student) {
          results.notFound.push(email)
          continue
        }

        // Check if user is a student
        if (student.role !== 'student') {
          results.errors.push(`${email} is not a student`)
          continue
        }

        // Check if already enrolled
        const { data: existingEnrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('student_id', student.id)
          .eq('course_id', params.courseId)
          .single()

        if (existingEnrollment) {
          results.alreadyEnrolled.push(email)
          continue
        }

        // Enroll the student
        const { error: enrollError } = await supabase
          .from('course_enrollments')
          .insert({
            student_id: student.id,
            course_id: params.courseId,
            enrollment_date: new Date().toISOString(),
            is_active: true
          })

        if (enrollError) {
          logger.error('Error enrolling student:', enrollError)
          results.errors.push(`Failed to enroll ${email}`)
        } else {
          results.enrolled.push(email)

          // Create notification for the student
          await supabase
            .from('notifications')
            .insert({
              organization_id: course.organization_id,
              user_id: student.id,
              title: 'Course Enrollment',
              message: `You have been enrolled in the course: ${course.title}`,
              type: 'course',
              data: {
                course_id: params.courseId,
                course_title: course.title
              },
              action_url: `/student/courses/${params.courseId}`
            })
        }
      } catch (error) {
        logger.error(`Error processing ${email}:`, error)
        results.errors.push(`Error processing ${email}`)
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    logger.error('Error in enroll students API:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
