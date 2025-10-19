import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/exam/monitoring/log-event
 * 
 * Logs general exam events (focus changes, navigation, etc.)
 * Used by Electron app to track student activity during exam
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json()

    const {
      submissionId,
      examId,
      studentId,
      eventType,
      eventCategory = 'security',
      severity = 'info',
      eventMessage,
      eventData = {},
      durationMs,
      questionId,
      sectionId,
      ipAddress,
      userAgent,
      browserInfo = {},
      screenResolution,
      appVersion,
      osPlatform,
      isVm = false,
      vmDetails,
      monitorCount = 1
    } = body

    // Validate required fields
    if (!submissionId || !examId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: submissionId, examId, eventType' },
        { status: 400 }
      )
    }

    // Insert monitoring log
    const { data: log, error: logError } = await supabase
      .from('exam_monitoring_logs')
      .insert({
        exam_submission_id: submissionId,
        exam_id: examId,
        student_id: studentId,
        event_type: eventType,
        event_category: eventCategory,
        severity: severity,
        event_message: eventMessage || `Event: ${eventType}`,
        event_data: eventData,
        duration_ms: durationMs,
        question_id: questionId,
        section_id: sectionId,
        ip_address: ipAddress,
        user_agent: userAgent,
        browser_info: browserInfo,
        screen_resolution: screenResolution,
        app_version: appVersion,
        os_platform: osPlatform,
        is_vm: isVm,
        vm_details: vmDetails,
        monitor_count: monitorCount,
        event_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (logError) {
      logger.error('Error logging event:', logError)
      return NextResponse.json(
        { error: 'Failed to log event' },
        { status: 500 }
      )
    }

    // Calculate risk score after logging event
    if (submissionId) {
      try {
        await supabase.rpc('calculate_risk_score', { submission_id: submissionId })
      } catch (riskError) {
        logger.error('Error calculating risk score:', riskError)
        // Don't fail the request if risk calculation fails
      }
    }

    return NextResponse.json({
      success: true,
      logId: log.id,
      message: 'Event logged successfully'
    })

  } catch (error) {
    logger.error('Error in log-event endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
