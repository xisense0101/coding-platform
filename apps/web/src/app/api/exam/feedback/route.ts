import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/exam/feedback
 * 
 * Submit student feedback after exam completion
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json()

    const {
      examId,
      submissionId,
      studentId,
      studentEmail,
      studentName,
      rollNumber,
      rating,
      feedbackText
    } = body

    // Validate required fields
    if (!examId || !submissionId || !studentEmail || !studentName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate rating if provided
    if (rating !== null && rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        )
      }
    }

    // Check if feedback already exists for this submission
    const { data: existingFeedback } = await supabase
      .from('exam_feedback')
      .select('id')
      .eq('exam_submission_id', submissionId)
      .single()

    if (existingFeedback) {
      // Update existing feedback
      const { data: feedback, error: updateError } = await supabase
        .from('exam_feedback')
        .update({
          rating,
          feedback_text: feedbackText,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFeedback.id)
        .select()
        .single()

      if (updateError) {
        logger.error('Error updating feedback:', updateError)
        return NextResponse.json(
          { error: 'Failed to update feedback' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        feedback,
        message: 'Feedback updated successfully'
      })
    }

    // Create new feedback
    const { data: feedback, error: insertError } = await supabase
      .from('exam_feedback')
      .insert({
        exam_id: examId,
        exam_submission_id: submissionId,
        student_id: studentId || null,
        student_email: studentEmail,
        student_name: studentName,
        roll_number: rollNumber || null,
        rating,
        feedback_text: feedbackText,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      logger.error('Error creating feedback:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      feedback,
      message: 'Thank you for your feedback!'
    })

  } catch (error) {
    logger.error('Error in exam feedback endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
