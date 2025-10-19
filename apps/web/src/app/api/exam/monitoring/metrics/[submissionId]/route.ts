import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/exam/monitoring/metrics/:submissionId
 * 
 * Gets security metrics and monitoring data for a specific submission
 * Used by both student (to see their stats) and teacher (for monitoring)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()

    // Get security metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('exam_security_metrics')
      .select('*')
      .eq('exam_submission_id', params.submissionId)
      .single()

    if (metricsError && metricsError.code !== 'PGRST116') { // PGRST116 = not found
      logger.error('Error fetching security metrics:', metricsError)
      return NextResponse.json(
        { error: 'Failed to fetch security metrics' },
        { status: 500 }
      )
    }

    // Get recent events (last 50)
    const { data: recentEvents, error: eventsError } = await supabase
      .from('exam_monitoring_logs')
      .select('*')
      .eq('exam_submission_id', params.submissionId)
      .order('event_timestamp', { ascending: false })
      .limit(50)

    // Get violations
    const { data: violations, error: violationsError } = await supabase
      .from('exam_violations')
      .select('*')
      .eq('exam_submission_id', params.submissionId)
      .order('violation_timestamp', { ascending: false })

    // Get cheating flags
    const { data: flags, error: flagsError } = await supabase
      .from('exam_cheating_flags')
      .select('*')
      .eq('exam_submission_id', params.submissionId)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      success: true,
      metrics: metrics || {
        total_tab_switches: 0,
        total_screen_locks: 0,
        total_window_blur_events: 0,
        copy_attempts: 0,
        paste_attempts: 0,
        zoom_changes: 0,
        risk_score: 0,
        risk_level: 'low',
        is_flagged_for_review: false
      },
      recentEvents: recentEvents || [],
      violations: violations || [],
      flags: flags || [],
      summary: {
        totalEvents: recentEvents?.length || 0,
        totalViolations: violations?.length || 0,
        totalFlags: flags?.length || 0,
        riskScore: metrics?.risk_score || 0,
        riskLevel: metrics?.risk_level || 'low'
      }
    })

  } catch (error) {
    logger.error('Error in metrics endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
