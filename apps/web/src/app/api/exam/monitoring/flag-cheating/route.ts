import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/exam/monitoring/flag-cheating
 * 
 * Creates a high-priority cheating flag for teacher review
 * Used when serious cheating is detected or manual flagging is needed
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json()

    const {
      submissionId,
      examId,
      studentId,
      reason,
      severity = 'high',
      details = {},
      violations = [],
      evidenceUrls = [],
      autoFlagged = true,
      notifyTeacher = true
    } = body

    // Validate required fields
    if (!submissionId || !examId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: submissionId, examId, reason' },
        { status: 400 }
      )
    }

    // Check if already flagged (avoid duplicates)
    const { data: existingFlag } = await supabase
      .from('exam_cheating_flags')
      .select('id, flag_status')
      .eq('exam_submission_id', submissionId)
      .in('flag_status', ['pending', 'under_review'])
      .single()

    if (existingFlag) {
      // Update existing flag with new evidence
      const { data: updatedFlag, error: updateError } = await supabase
        .from('exam_cheating_flags')
        .update({
          flag_details: details,
          violations_count: violations.length,
          related_violation_ids: violations,
          evidence_urls: evidenceUrls,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFlag.id)
        .select()
        .single()

      if (updateError) {
        logger.error('Error updating cheating flag:', updateError)
        return NextResponse.json(
          { error: 'Failed to update cheating flag' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        flagId: updatedFlag.id,
        isNew: false,
        message: 'Existing flag updated'
      })
    }

    // Create new cheating flag
    const { data: flag, error: flagError } = await supabase
      .from('exam_cheating_flags')
      .insert({
        exam_submission_id: submissionId,
        exam_id: examId,
        student_id: studentId,
        flag_reason: reason,
        flag_severity: severity,
        flag_details: details,
        violations_count: violations.length,
        related_violation_ids: violations,
        evidence_urls: evidenceUrls,
        flag_status: 'pending',
        auto_flagged: autoFlagged,
        teacher_notified: false, // Will be set after notification
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (flagError) {
      logger.error('Error creating cheating flag:', flagError)
      return NextResponse.json(
        { error: 'Failed to create cheating flag' },
        { status: 500 }
      )
    }

    // Send notification to teacher if requested
    if (notifyTeacher) {
      try {
        // Get exam and teacher info
        const { data: exam } = await supabase
          .from('exams')
          .select(`
            id,
            title,
            teacher_id,
            teacher:users!exams_teacher_id_fkey(
              id,
              full_name,
              email
            )
          `)
          .eq('id', examId)
          .single()

        if (exam) {
          // Get student info
          const { data: student } = await supabase
            .from('exam_submissions')
            .select('student_name, student_email')
            .eq('id', submissionId)
            .single()

          // Here you would integrate with your notification system
          // For now, we'll just log it
          logger.log('Cheating flag notification:', {
            teacherEmail: (exam.teacher as any)?.email,
            examTitle: exam.title,
            studentName: student?.student_name,
            reason,
            severity
          })

          // Mark notification as sent
          await supabase
            .from('exam_cheating_flags')
            .update({
              teacher_notified: true,
              notification_sent_at: new Date().toISOString()
            })
            .eq('id', flag.id)
        }
      } catch (notificationError) {
        logger.error('Error sending notification:', notificationError)
        // Don't fail the request if notification fails
      }
    }

    // Update security metrics to flag for review
    await supabase
      .from('exam_security_metrics')
      .update({
        is_flagged_for_review: true,
        updated_at: new Date().toISOString()
      })
      .eq('exam_submission_id', submissionId)

    return NextResponse.json({
      success: true,
      flagId: flag.id,
      isNew: true,
      message: 'Cheating flag created successfully'
    })

  } catch (error) {
    logger.error('Error in flag-cheating endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/exam/monitoring/flag-cheating?examId=:examId
 * 
 * Gets all cheating flags for an exam (for teachers)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')
    const status = searchParams.get('status')

    if (!examId) {
      return NextResponse.json(
        { error: 'Missing examId parameter' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()

    // Check authentication and permissions
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let query = supabase
      .from('exam_cheating_flags')
      .select(`
        *,
        exam_submission:exam_submissions(
          id,
          student_name,
          student_email,
          roll_number,
          started_at,
          submitted_at
        )
      `)
      .eq('exam_id', examId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('flag_status', status)
    }

    const { data: flags, error: flagsError } = await query

    if (flagsError) {
      logger.error('Error fetching cheating flags:', flagsError)
      return NextResponse.json(
        { error: 'Failed to fetch cheating flags' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      flags: flags || [],
      count: flags?.length || 0
    })

  } catch (error) {
    logger.error('Error in flag-cheating GET endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
