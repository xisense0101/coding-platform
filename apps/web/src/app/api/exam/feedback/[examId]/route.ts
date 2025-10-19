import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/exam/feedback/[examId]
 * 
 * Get all feedback for a specific exam (teacher/admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    const { examId } = params

    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is teacher or admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || (userProfile.role !== 'teacher' && userProfile.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Access denied. Only teachers and admins can view feedback.' },
        { status: 403 }
      )
    }

    // Verify teacher owns this exam or is admin
    const { data: exam } = await supabase
      .from('exams')
      .select('teacher_id, co_teachers')
      .eq('id', examId)
      .single()

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    const isTeacher = exam.teacher_id === user.id || exam.co_teachers?.includes(user.id)
    const isAdmin = userProfile.role === 'admin'

    if (!isTeacher && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to view this exam feedback.' },
        { status: 403 }
      )
    }

    // Get all feedback for this exam
    const { data: feedbackList, error: feedbackError } = await supabase
      .from('exam_feedback')
      .select('*')
      .eq('exam_id', examId)
      .order('submitted_at', { ascending: false })

    if (feedbackError) {
      logger.error('Error fetching feedback:', feedbackError)
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      )
    }

    // Get statistics
    const totalFeedback = feedbackList.length
    const unreadCount = feedbackList.filter(f => !f.is_read).length
    const averageRating = feedbackList.length > 0
      ? feedbackList.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackList.filter(f => f.rating).length
      : 0

    return NextResponse.json({
      success: true,
      feedback: feedbackList,
      statistics: {
        total: totalFeedback,
        unread: unreadCount,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution: {
          5: feedbackList.filter(f => f.rating === 5).length,
          4: feedbackList.filter(f => f.rating === 4).length,
          3: feedbackList.filter(f => f.rating === 3).length,
          2: feedbackList.filter(f => f.rating === 2).length,
          1: feedbackList.filter(f => f.rating === 1).length,
        }
      }
    })

  } catch (error) {
    logger.error('Error in get exam feedback endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/exam/feedback/[examId]
 * 
 * Mark feedback as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json()
    const { feedbackId } = body

    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Mark as read
    const { error: updateError } = await supabase
      .from('exam_feedback')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        read_by: user.id
      })
      .eq('id', feedbackId)

    if (updateError) {
      logger.error('Error marking feedback as read:', updateError)
      return NextResponse.json(
        { error: 'Failed to update feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback marked as read'
    })

  } catch (error) {
    logger.error('Error in mark feedback as read endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
