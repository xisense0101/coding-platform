import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string; submissionId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Verify user is the teacher of this exam
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('teacher_id, title')
      .eq('id', params.examId)
      .eq('organization_id', userProfile.organization_id)
      .single()

    if (examError || !exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    if (exam.teacher_id !== session.user.id && userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized to view this submission' },
        { status: 403 }
      )
    }

    // Fetch the specific submission
    const { data: submission, error: submissionError } = await supabase
      .from('exam_submissions')
      .select(`
        id,
        student_id,
        student_name,
        student_email,
        roll_number,
        student_section,
        attempt_number,
        started_at,
        submitted_at,
        time_taken_minutes,
        auto_submitted,
        total_score,
        max_score,
        percentage,
        is_passed,
        submission_status,
        is_submitted,
        answers,
        ip_address,
        created_at
      `)
      .eq('id', params.submissionId)
      .eq('exam_id', params.examId)
      .single()

    if (submissionError) {
      console.error('Error fetching submission:', submissionError)
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      submission
    })

  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
