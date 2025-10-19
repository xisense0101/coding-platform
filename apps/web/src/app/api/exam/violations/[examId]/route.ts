import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

// GET - Fetch all violations for an exam
export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Verify teacher authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { examId } = params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, reviewed, dismissed

    // Verify teacher owns this exam
    const { data: exam } = await supabase
      .from('exams')
      .select('teacher_id')
      .eq('id', examId)
      .single()

    if (!exam || exam.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build query
    let query = supabase
      .from('exam_violations')
      .select(`
        *,
        submission:submission_id (
          id,
          student:student_id (
            id,
            email,
            profiles (
              first_name,
              last_name
            )
          )
        )
      `)
      .eq('submission_id', examId)
      .order('created_at', { ascending: false })

    // Apply status filter if provided
    if (status) {
      query = query.eq('review_status', status)
    }

    const { data: violations, error } = await query

    if (error) {
      console.error('Error fetching violations:', error)
      return NextResponse.json({ error: 'Failed to fetch violations' }, { status: 500 })
    }

    // Also fetch cheating flags
    const { data: flags } = await supabase
      .from('exam_cheating_flags')
      .select(`
        *,
        submission:submission_id (
          id,
          student:student_id (
            id,
            email,
            profiles (
              first_name,
              last_name
            )
          )
        )
      `)
      .eq('submission_id', examId)
      .order('created_at', { ascending: false })

    // Get summary statistics
    const { data: metrics } = await supabase
      .from('exam_security_metrics')
      .select('*')
      .eq('submission_id', examId)

    const summary = {
      total_violations: violations?.length || 0,
      pending: violations?.filter((v: any) => v.review_status === 'pending').length || 0,
      reviewed: violations?.filter((v: any) => v.review_status === 'reviewed').length || 0,
      dismissed: violations?.filter((v: any) => v.review_status === 'dismissed').length || 0,
      total_flags: flags?.length || 0,
      high_risk_students: metrics?.filter((m: any) => m.risk_score > 70).length || 0
    }

    return NextResponse.json({ 
      violations,
      flags,
      summary
    })
  } catch (error) {
    console.error('Error in GET /api/exam/violations/[examId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
