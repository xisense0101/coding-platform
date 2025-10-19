import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

// PATCH - Review a violation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { violationId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Verify teacher authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { violationId } = params
    const body = await request.json()
    const { 
      reviewStatus, // 'reviewed' or 'dismissed'
      reviewNotes,
      actionTaken // 'warning', 'invalidate_score', 'allow_retest', 'no_action'
    } = body

    // Verify violation exists and teacher owns the exam
    const { data: violation } = await supabase
      .from('exam_violations')
      .select(`
        id,
        submission:submission_id (
          exam:exam_id (
            teacher_id
          )
        )
      `)
      .eq('id', violationId)
      .single()

    if (!violation || (violation.submission as any)?.exam?.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update violation
    const { data: updatedViolation, error } = await supabase
      .from('exam_violations')
      .update({
        review_status: reviewStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes,
        action_taken: actionTaken
      })
      .eq('id', violationId)
      .select()
      .single()

    if (error) {
      console.error('Error reviewing violation:', error)
      return NextResponse.json({ error: 'Failed to review violation' }, { status: 500 })
    }

    return NextResponse.json({ 
      violation: updatedViolation,
      message: 'Violation reviewed successfully'
    })
  } catch (error) {
    console.error('Error in PATCH /api/exam/violations/review/[violationId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
