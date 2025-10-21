import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/monitoring/system-check
 * 
 * Reports system environment details at exam start for security validation
 * Used by Electron app to validate system configuration
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json()

    const {
      userId,
      quizId,
      systemInfo
    } = body

    // Validate required fields
    if (!userId || !quizId || !systemInfo) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, quizId, systemInfo' },
        { status: 400 }
      )
    }

    const {
      isVM = false,
      vmDetails = '',
      platform = '',
      displayCount = 1,
      appVersion = '',
      diskSpace = 0,
      memory = 0,
      gpu = ''
    } = systemInfo

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

    // Log system check as an event
    const { error: logError } = await supabase
      .from('exam_monitoring_logs')
      .insert({
        exam_submission_id: submission.id,
        exam_id: quizId,
        student_id: userId,
        event_type: 'exam_started',
        event_category: 'system',
        severity: isVM || displayCount > 1 ? 'critical' : 'info',
        event_message: isVM 
          ? 'Virtual machine detected at exam start' 
          : displayCount > 1 
            ? `Multiple monitors detected (${displayCount})` 
            : 'System check passed',
        event_data: {
          diskSpace,
          memory,
          gpu,
          systemCheckPassed: !isVM && displayCount <= 1
        },
        app_version: appVersion,
        os_platform: platform,
        is_vm: isVM,
        vm_details: vmDetails,
        monitor_count: displayCount,
        event_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      })

    if (logError) {
      logger.error('Error logging system check:', logError)
      return NextResponse.json(
        { error: 'Failed to log system check' },
        { status: 500 }
      )
    }

    // Update security metrics if VM or multiple displays detected
    if (isVM || displayCount > 1) {
      const { data: metrics } = await supabase
        .from('exam_security_metrics')
        .select('id')
        .eq('exam_submission_id', submission.id)
        .single()

      if (metrics) {
        await supabase
          .from('exam_security_metrics')
          .update({
            is_vm_detected: isVM,
            multi_monitor_detected: displayCount > 1,
            is_flagged_for_review: true
          })
          .eq('id', metrics.id)
      }
    }

    // Check if system is allowed
    let allowExam = true
    let message = 'System check passed'
    let status: 'ok' | 'error' = 'ok'

    // Note: You can customize these rules based on your requirements
    // For now, we'll allow the exam but flag the issues
    if (isVM) {
      // Allow but flag
      message = 'Virtual machine detected. This will be flagged for review.'
      logger.warn(`VM detected for user ${userId} in exam ${quizId}: ${vmDetails}`)
    } else if (displayCount > 1) {
      // Allow but flag
      message = `Multiple monitors detected (${displayCount}). This will be flagged for review.`
      logger.warn(`Multiple displays (${displayCount}) detected for user ${userId} in exam ${quizId}`)
    }

    // If you want to block the exam for VM or multiple monitors, uncomment:
    // if (isVM) {
    //   allowExam = false
    //   status = 'error'
    //   message = 'Virtual machine detected. Please use a physical machine.'
    // } else if (displayCount > 1) {
    //   allowExam = false
    //   status = 'error'
    //   message = 'Multiple monitors detected. Please disconnect additional displays and use only one monitor.'
    // }

    return NextResponse.json({
      status,
      allowExam,
      message
    })

  } catch (error) {
    logger.error('Error in system-check endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
