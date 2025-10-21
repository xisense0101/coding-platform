import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/monitoring/heartbeat
 * 
 * Periodic heartbeat to report system status and keep session alive
 * Used by Electron app to maintain connection and sync server time
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const searchParams = request.nextUrl.searchParams
    
    const quizId = searchParams.get('quizId')
    const userId = searchParams.get('userId')

    // Validate required fields
    if (!quizId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: quizId, userId' },
        { status: 400 }
      )
    }

    // Get the exam to check if it should continue
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, end_time, is_active')
      .eq('id', quizId)
      .single()

    if (examError || !exam) {
      return NextResponse.json({
        status: 'ok',
        serverTime: Date.now(),
        shouldContinue: false,
        message: 'Exam not found'
      })
    }

    // Check if exam has ended
    const now = new Date()
    const endTime = exam.end_time ? new Date(exam.end_time) : null
    const shouldContinue = exam.is_active && (!endTime || endTime > now)

    // Get submission to update last seen
    const { data: submission, error: submissionError } = await supabase
      .from('exam_submissions')
      .select('id, is_submitted')
      .eq('exam_id', quizId)
      .eq('student_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!submissionError && submission && !submission.is_submitted) {
      // Update last activity timestamp
      await supabase
        .from('exam_submissions')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', submission.id)

      // Log heartbeat event (optionally, every 5th heartbeat to reduce logs)
      // You can add logic to only log every Nth heartbeat
      const shouldLogHeartbeat = Math.random() < 0.1 // Log 10% of heartbeats

      if (shouldLogHeartbeat) {
        await supabase
          .from('exam_monitoring_logs')
          .insert({
            exam_submission_id: submission.id,
            exam_id: quizId,
            student_id: userId,
            event_type: 'custom_event',
            event_category: 'system',
            severity: 'info',
            event_message: 'Heartbeat received',
            event_data: {
              heartbeat: true,
              shouldContinue
            },
            event_timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
          })
      }
    }

    return NextResponse.json({
      status: 'ok',
      serverTime: Date.now(),
      shouldContinue: shouldContinue && (!submission?.is_submitted),
      examActive: exam.is_active,
      examEnded: endTime ? endTime <= now : false
    })

  } catch (error) {
    logger.error('Error in heartbeat endpoint:', error)
    return NextResponse.json(
      { 
        status: 'ok', 
        serverTime: Date.now(),
        shouldContinue: true // Default to true on error to avoid disrupting exam
      },
      { status: 200 } // Return 200 even on error to avoid breaking client
    )
  }
}
