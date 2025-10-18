import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

import { logger } from '@/lib/utils/logger'

/**
 * GET /api/exams/[examId]/submissions/check
 * Check submission status for a user (for debugging)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Either userId or email is required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()

    let query = supabase
      .from('exam_submissions')
      .select('*')
      .eq('exam_id', params.examId)

    if (userId) {
      query = query.eq('student_id', userId)
    } else if (email) {
      query = query.eq('student_email', email)
    }

    const { data: submissions, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch submissions', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      examId: params.examId,
      userId,
      email,
      submissions: submissions || [],
      count: submissions?.length || 0
    })

  } catch (error) {
    logger.error('Error checking submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/exams/[examId]/submissions/check
 * Reset submissions for testing (WARNING: Use only in development!)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')
    const submissionId = searchParams.get('submissionId')

    if (!userId && !email && !submissionId) {
      return NextResponse.json(
        { error: 'Either userId, email, or submissionId is required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()

    let query = supabase
      .from('exam_submissions')
      .delete()
      .eq('exam_id', params.examId)

    if (submissionId) {
      query = query.eq('id', submissionId)
    } else if (userId) {
      query = query.eq('student_id', userId)
    } else if (email) {
      query = query.eq('student_email', email)
    }

    const { error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete submissions', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Submissions deleted successfully',
      deletedCount: count
    })

  } catch (error) {
    logger.error('Error deleting submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
