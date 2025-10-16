import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const body = await request.json()
    const { testCode, studentEmail } = body

    if (!testCode) {
      return NextResponse.json(
        { valid: false, message: 'Test code is required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()

    // Check for duplicate submission by email (if provided)
    if (studentEmail) {
      const { data: existingSubmission, error: submissionError } = await supabase
        .from('exam_submissions')
        .select('id, student_email, is_submitted')
        .eq('exam_id', params.examId)
        .eq('student_email', studentEmail)
        .eq('is_submitted', true)
        .maybeSingle()

      if (submissionError && submissionError.code !== 'PGRST116') {
        console.error('Error checking existing submission:', submissionError)
      } else if (existingSubmission) {
        return NextResponse.json(
          { 
            valid: false, 
            message: 'This email has already been used to submit this exam. You cannot take it again.',
            isDuplicate: true 
          },
          { status: 400 }
        )
      }
    }

    // Fetch exam with test code details
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('test_code, test_code_type, test_code_rotation_minutes, test_code_last_rotated, start_time, end_time')
      .eq('id', params.examId)
      .single()

    if (examError || !exam) {
      return NextResponse.json(
        { valid: false, message: 'Exam not found' },
        { status: 404 }
      )
    }

    // Check if exam requires a test code
    if (!exam.test_code) {
      // No test code required for this exam
      return NextResponse.json({ valid: true })
    }

    // Check if test code has expired (for rotating codes)
    if (exam.test_code_type === 'rotating' && exam.test_code_last_rotated && exam.test_code_rotation_minutes) {
      const lastRotated = new Date(exam.test_code_last_rotated)
      const expiryTime = new Date(lastRotated.getTime() + exam.test_code_rotation_minutes * 60000)
      const now = new Date()

      if (now > expiryTime) {
        return NextResponse.json(
          { valid: false, message: 'Test code has expired. Please get a new code from your teacher.' },
          { status: 400 }
        )
      }
    }

    // Validate test code
    if (testCode.toUpperCase() !== exam.test_code.toUpperCase()) {
      return NextResponse.json(
        { valid: false, message: 'Invalid test code. Please check and try again.' },
        { status: 400 }
      )
    }

    // Check if exam is currently active
    const now = new Date()
    const startTime = new Date(exam.start_time)
    const endTime = new Date(exam.end_time)

    if (now < startTime) {
      return NextResponse.json(
        { valid: false, message: 'Exam has not started yet' },
        { status: 400 }
      )
    }

    if (now > endTime) {
      return NextResponse.json(
        { valid: false, message: 'Exam has ended' },
        { status: 400 }
      )
    }

    return NextResponse.json({ valid: true })

  } catch (error) {
    console.error('Error validating test code:', error)
    return NextResponse.json(
      { valid: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
