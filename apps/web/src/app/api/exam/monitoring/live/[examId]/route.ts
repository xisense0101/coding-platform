import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/exam/monitoring/live/:examId
 * 
 * Gets real-time monitoring data for all active students in an exam
 * Used by teachers to monitor exam progress and violations in real-time
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all active submissions for this exam
    const { data: submissions, error: submissionsError } = await supabase
      .from('exam_submissions')
      .select(`
        id,
        student_id,
        student_name,
        student_email,
        roll_number,
        student_section,
        started_at,
        submitted_at,
        submission_status,
        is_submitted,
        total_score,
        max_score
      `)
      .eq('exam_id', params.examId)
      .order('started_at', { ascending: false })

    if (submissionsError) {
      logger.error('Error fetching submissions:', submissionsError)
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      )
    }

    // Get security metrics for each submission
    const submissionIds = (submissions || []).map(s => s.id)
    
    const { data: metrics, error: metricsError } = await supabase
      .from('exam_security_metrics')
      .select('*')
      .in('exam_submission_id', submissionIds)

    // Get recent violations (last 24 hours)
    const { data: recentViolations, error: violationsError } = await supabase
      .from('exam_violations')
      .select(`
        id,
        exam_submission_id,
        violation_type,
        violation_severity,
        violation_message,
        violation_timestamp,
        is_reviewed
      `)
      .eq('exam_id', params.examId)
      .gte('violation_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('violation_timestamp', { ascending: false })

    // Get cheating flags
    const { data: flags, error: flagsError } = await supabase
      .from('exam_cheating_flags')
      .select(`
        id,
        exam_submission_id,
        flag_reason,
        flag_severity,
        flag_status,
        violations_count,
        created_at
      `)
      .eq('exam_id', params.examId)
      .in('flag_status', ['pending', 'under_review'])

    // Get recent events (last 100)
    const { data: recentEvents, error: eventsError } = await supabase
      .from('exam_monitoring_logs')
      .select(`
        id,
        exam_submission_id,
        event_type,
        severity,
        event_message,
        event_timestamp
      `)
      .eq('exam_id', params.examId)
      .gte('event_timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('event_timestamp', { ascending: false })
      .limit(100)

    // Combine data for each student
    const studentsData = (submissions || []).map(submission => {
      const studentMetrics = metrics?.find(m => m.exam_submission_id === submission.id)
      const studentViolations = recentViolations?.filter(v => v.exam_submission_id === submission.id) || []
      const studentFlags = flags?.filter(f => f.exam_submission_id === submission.id) || []
      const studentEvents = recentEvents?.filter(e => e.exam_submission_id === submission.id) || []

      return {
        submission,
        metrics: studentMetrics || {
          total_tab_switches: 0,
          total_tab_switches_in: 0,
          total_screen_locks: 0,
          risk_score: 0,
          risk_level: 'low',
          is_flagged_for_review: false
        },
        violations: studentViolations,
        flags: studentFlags,
        recentEvents: studentEvents.slice(0, 10), // Last 10 events per student
        status: submission.is_submitted ? 'completed' : 'in_progress',
        riskLevel: studentMetrics?.risk_level || 'low',
        violationCount: studentViolations.length,
        flagCount: studentFlags.length
      }
    })

    // Calculate summary statistics
    const activeStudents = studentsData.filter(s => s.status === 'in_progress').length
    const completedStudents = studentsData.filter(s => s.status === 'completed').length
    const flaggedStudents = studentsData.filter(s => s.metrics.is_flagged_for_review).length
    const highRiskStudents = studentsData.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').length

    return NextResponse.json({
      success: true,
      students: studentsData,
      summary: {
        totalStudents: studentsData.length,
        activeStudents,
        completedStudents,
        flaggedStudents,
        highRiskStudents,
        totalViolations: recentViolations?.length || 0,
        totalFlags: flags?.length || 0
      },
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Error in live monitoring endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
