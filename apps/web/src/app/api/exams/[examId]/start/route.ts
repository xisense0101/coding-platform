import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

/**
 * POST /api/exams/[examId]/start
 * Starts or resumes an exam submission
 * Returns existing submission if found, creates new one if not
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const body = await request.json()
    const { 
      userId, 
      studentName, 
      studentEmail, 
      rollNumber, 
      studentSection 
    } = body

    if (!userId || !studentEmail) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()

    console.log('🔍 Checking for existing submission...', {
      examId: params.examId,
      userId,
      studentEmail
    })

    // Check for existing submission
    const { data: existingSubmission, error: fetchError } = await supabase
      .from('exam_submissions')
      .select('id, answers, is_submitted, submitted_at, started_at, submission_status')
      .eq('exam_id', params.examId)
      .eq('student_id', userId)
      .eq('attempt_number', 1)
      .maybeSingle()

    if (fetchError) {
      console.error('❌ Error fetching submission:', fetchError)
      return NextResponse.json(
        { 
          error: 'Failed to check existing submission', 
          details: fetchError.message 
        },
        { status: 500 }
      )
    }

    // Log submission details for debugging
    if (existingSubmission) {
      console.log('📋 Existing submission found:', {
        id: existingSubmission.id,
        is_submitted: existingSubmission.is_submitted,
        submission_status: existingSubmission.submission_status,
        submitted_at: existingSubmission.submitted_at,
        started_at: existingSubmission.started_at,
        answers_count: Object.keys(existingSubmission.answers || {}).length
      })
    }

    // If submission exists and is already submitted, reject
    if (existingSubmission && existingSubmission.is_submitted) {
      console.log('❌ Submission already submitted:', {
        submittedAt: existingSubmission.submitted_at,
        status: existingSubmission.submission_status
      })
      return NextResponse.json(
        { 
          error: 'This exam has already been submitted',
          alreadySubmitted: true,
          submittedAt: existingSubmission.submitted_at,
          submissionId: existingSubmission.id
        },
        { status: 400 }
      )
    }

    // If submission exists and is in progress, return it
    if (existingSubmission) {
      console.log('✅ Found existing submission:', existingSubmission.id)
      return NextResponse.json({
        success: true,
        submission: {
          id: existingSubmission.id,
          answers: existingSubmission.answers || {},
          startedAt: existingSubmission.started_at
        },
        isNew: false
      })
    }

    // No existing submission, create a new one
    console.log('📝 Creating new submission...')

    // Get client IP (optional)
    let ipAddress = null
    try {
      const forwarded = request.headers.get('x-forwarded-for')
      const realIp = request.headers.get('x-real-ip')
      ipAddress = forwarded?.split(',')[0] || realIp || null
    } catch (error) {
      console.warn('⚠️ Could not determine IP address:', error)
    }

    const { data: newSubmission, error: insertError } = await supabase
      .from('exam_submissions')
      .insert({
        exam_id: params.examId,
        student_id: userId,
        attempt_number: 1,
        student_name: studentName || '',
        student_email: studentEmail,
        roll_number: rollNumber || null,
        student_section: studentSection || null,
        started_at: new Date().toISOString(),
        answers: {},
        is_submitted: false,
        submission_status: 'in_progress',
        ip_address: ipAddress,
      })
      .select('id, started_at')
      .single()

    if (insertError) {
      console.error('❌ Error creating submission:', insertError)
      return NextResponse.json(
        { 
          error: 'Failed to create exam submission', 
          details: insertError.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ Created new submission:', newSubmission.id)

    return NextResponse.json({
      success: true,
      submission: {
        id: newSubmission.id,
        answers: {},
        startedAt: newSubmission.started_at
      },
      isNew: true
    })

  } catch (error) {
    console.error('💥 Error in exam start:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
