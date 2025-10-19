import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/exam/monitoring/log-violation
 * 
 * Logs exam violations with severity levels
 * Used when suspicious activity is detected
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json()

    const {
      submissionId,
      examId,
      studentId,
      violationType,
      violationSeverity = 'medium',
      violationMessage,
      violationDetails = {},
      questionId,
      actionTaken = 'logged_only',
      autoDetected = true,
      monitoringLogId
    } = body

    // Validate required fields
    if (!submissionId || !examId || !violationType || !violationMessage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert violation record
    const { data: violation, error: violationError } = await supabase
      .from('exam_violations')
      .insert({
        exam_submission_id: submissionId,
        exam_id: examId,
        student_id: studentId,
        violation_type: violationType,
        violation_severity: violationSeverity,
        violation_message: violationMessage,
        violation_details: violationDetails,
        violation_timestamp: new Date().toISOString(),
        question_id: questionId,
        action_taken: actionTaken,
        auto_detected: autoDetected,
        monitoring_log_id: monitoringLogId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (violationError) {
      logger.error('Error logging violation:', violationError)
      return NextResponse.json(
        { error: 'Failed to log violation' },
        { status: 500 }
      )
    }

    // Get violation count for this submission
    const { count: violationCount } = await supabase
      .from('exam_violations')
      .select('*', { count: 'exact', head: true })
      .eq('exam_submission_id', submissionId)

    // Get exam settings to check thresholds
    const { data: exam } = await supabase
      .from('exams')
      .select('max_tab_switches, auto_terminate_on_violations')
      .eq('id', examId)
      .single()

    // Check if violation threshold reached
    let shouldTerminate = false
    if (exam?.auto_terminate_on_violations && violationCount && violationCount >= (exam.max_tab_switches || 3)) {
      shouldTerminate = true

      // Log threshold reached event
      await supabase
        .from('exam_monitoring_logs')
        .insert({
          exam_submission_id: submissionId,
          exam_id: examId,
          student_id: studentId,
          event_type: 'violation_threshold_reached',
          event_category: 'violation',
          severity: 'critical',
          event_message: `Violation threshold reached: ${violationCount} violations`,
          event_data: { violationCount, threshold: exam.max_tab_switches },
          event_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
    }

    // Auto-flag for high severity violations
    if (violationSeverity === 'high' || violationSeverity === 'critical') {
      // Check if already flagged
      const { data: existingFlag } = await supabase
        .from('exam_cheating_flags')
        .select('id')
        .eq('exam_submission_id', submissionId)
        .eq('flag_status', 'pending')
        .single()

      if (!existingFlag) {
        await supabase
          .from('exam_cheating_flags')
          .insert({
            exam_submission_id: submissionId,
            exam_id: examId,
            student_id: studentId,
            flag_reason: violationMessage,
            flag_severity: violationSeverity,
            flag_details: {
              violationType,
              violationDetails,
              totalViolations: violationCount
            },
            violations_count: violationCount || 0,
            related_violation_ids: [violation.id],
            flag_status: 'pending',
            auto_flagged: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }
    }

    // Calculate updated risk score
    try {
      await supabase.rpc('calculate_risk_score', { submission_id: submissionId })
    } catch (riskError) {
      logger.error('Error calculating risk score:', riskError)
    }

    return NextResponse.json({
      success: true,
      violationId: violation.id,
      violationCount: violationCount || 0,
      shouldTerminate,
      message: 'Violation logged successfully'
    })

  } catch (error) {
    logger.error('Error in log-violation endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
