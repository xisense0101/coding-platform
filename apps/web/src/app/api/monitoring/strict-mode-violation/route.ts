import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/monitoring/strict-mode-violation
 * 
 * Logs violations detected during strict mode (forbidden processes, multiple displays, etc.)
 * Used by Electron app to report security violations during exam
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json()

    const {
      userId,
      quizId,
      violationType,
      details,
      timestamp,
      severity = 'medium'
    } = body

    // Validate required fields
    if (!userId || !quizId || !violationType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, quizId, violationType' },
        { status: 400 }
      )
    }

    // Map violation type to event type
    const eventTypeMap: Record<string, string> = {
      'FORBIDDEN_PROCESS': 'suspicious_activity',
      'MULTIPLE_DISPLAYS': 'multi_monitor_detected',
      'SCREEN_LOCK': 'screen_locked',
      'WINDOW_BLUR': 'window_blur',
      'VM_DETECTED': 'vm_detected',
      'LOW_DISK_SPACE': 'custom_event',
      'MONITORING_FAILURE': 'custom_event'
    }

    const eventType = eventTypeMap[violationType] || 'suspicious_activity'

    // Map severity
    const severityMap: Record<string, 'info' | 'warning' | 'critical'> = {
      'low': 'info',
      'medium': 'warning',
      'high': 'critical'
    }
    const mappedSeverity = severityMap[severity.toLowerCase()] || 'warning'

    // Get submission ID
    const { data: submission, error: submissionError } = await supabase
      .from('exam_submissions')
      .select('id')
      .eq('exam_id', quizId)
      .eq('student_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (submissionError || !submission) {
      logger.error('Error finding submission:', submissionError)
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Log the violation as a monitoring event
    const { data: loggedEvent, error: logError } = await supabase
      .from('exam_monitoring_logs')
      .insert({
        exam_submission_id: submission.id,
        exam_id: quizId,
        student_id: userId,
        event_type: eventType,
        event_category: 'violation',
        severity: mappedSeverity,
        event_message: `Strict mode violation: ${violationType}`,
        event_data: {
          violationType,
          details,
          originalTimestamp: timestamp
        },
        event_timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (logError) {
      logger.error('Error logging violation:', logError)
      return NextResponse.json(
        { error: 'Failed to log violation' },
        { status: 500 }
      )
    }

    // Also log in exam_violations table for better tracking
    const violationTypeMap: Record<string, string> = {
      'FORBIDDEN_PROCESS': 'forbidden_process_detected',
      'MULTIPLE_DISPLAYS': 'multi_monitor_usage',
      'SCREEN_LOCK': 'prolonged_screen_lock',
      'WINDOW_BLUR': 'excessive_tab_switching',
      'VM_DETECTED': 'vm_usage_detected',
      'LOW_DISK_SPACE': 'recording_failure',
      'MONITORING_FAILURE': 'monitoring_app_failure'
    }

    const mappedViolationType = violationTypeMap[violationType] || 'suspicious_behavior'

    const { error: violationError } = await supabase
      .from('exam_violations')
      .insert({
        exam_submission_id: submission.id,
        exam_id: quizId,
        student_id: userId,
        violation_type: mappedViolationType,
        violation_severity: mappedSeverity,
        violation_message: details || `Strict mode violation: ${violationType}`,
        violation_details: {
          violationType,
          details,
          autoDetected: true
        },
        violation_timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
        is_reviewed: false,
        created_at: new Date().toISOString()
      })

    if (violationError) {
      logger.warn('Error creating violation record:', violationError)
      // Don't fail the request if violation creation fails
    }

    // Count total violations for this submission
    const { count: violationCount } = await supabase
      .from('exam_violations')
      .select('*', { count: 'exact', head: true })
      .eq('exam_submission_id', submission.id)

    // Determine action based on violation count
    let action = 'continue'
    const totalViolations = violationCount || 0

    // Auto-flag if too many violations (threshold: 5)
    if (totalViolations >= 5) {
      action = 'review_required'
      
      // Update security metrics to flag for review
      const { data: metrics } = await supabase
        .from('exam_security_metrics')
        .select('id')
        .eq('exam_submission_id', submission.id)
        .single()

      if (metrics) {
        await supabase
          .from('exam_security_metrics')
          .update({
            is_flagged_for_review: true,
            risk_score: Math.min(100, (totalViolations * 15)), // Increase risk score
            risk_level: totalViolations >= 10 ? 'critical' : totalViolations >= 7 ? 'high' : 'medium'
          })
          .eq('id', metrics.id)
      }
    }

    // Auto-terminate if critical threshold reached (threshold: 10)
    if (totalViolations >= 10) {
      action = 'terminate'
      
      // Create cheating flag
      await supabase
        .from('exam_cheating_flags')
        .insert({
          exam_submission_id: submission.id,
          exam_id: quizId,
          student_id: userId,
          flag_reason: `Excessive violations detected: ${totalViolations} total violations`,
          flag_severity: 'critical',
          flag_status: 'pending',
          violations_count: totalViolations,
          auto_flagged: true,
          requires_manual_review: true,
          created_at: new Date().toISOString()
        })

      logger.warn(`Auto-terminate triggered for user ${userId} in exam ${quizId}: ${totalViolations} violations`)
    }

    // Calculate risk score
    try {
      await supabase.rpc('calculate_risk_score', { submission_id: submission.id })
    } catch (riskError) {
      logger.error('Error calculating risk score:', riskError)
    }

    return NextResponse.json({
      status: 'ok',
      logged: true,
      action,
      violationCount: totalViolations,
      message: action === 'terminate' 
        ? 'Critical violation threshold reached. Session should be terminated.'
        : action === 'review_required'
          ? 'Multiple violations detected. Flagged for review.'
          : 'Violation logged successfully.'
    })

  } catch (error) {
    logger.error('Error in strict-mode-violation endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
