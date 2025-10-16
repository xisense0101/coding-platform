import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Verify user is the teacher of this exam
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('teacher_id, title, total_marks')
      .eq('id', params.examId)
      .eq('organization_id', userProfile.organization_id)
      .single()

    if (examError || !exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    if (exam.teacher_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to view results' },
        { status: 403 }
      )
    }

    // Fetch all submissions for this exam
    const { data: submissions, error: submissionsError } = await supabase
      .from('exam_submissions')
      .select(`
        id,
        student_id,
        student_name,
        student_email,
        roll_number,
        student_section,
        attempt_number,
        started_at,
        submitted_at,
        time_taken_minutes,
        auto_submitted,
        total_score,
        max_score,
        percentage,
        is_passed,
        submission_status,
        is_submitted,
        answers,
        ip_address,
        created_at
      `)
      .eq('exam_id', params.examId)
      .order('submitted_at', { ascending: false })

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError)
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const submittedSubmissions = submissions?.filter(s => s.is_submitted) || []
    const totalSubmissions = submittedSubmissions.length
    const totalAttempts = submissions?.length || 0
    
    const stats = {
      totalSubmissions: totalAttempts,
      completedSubmissions: totalSubmissions,
      inProgressSubmissions: totalAttempts - totalSubmissions,
      averageScore: totalSubmissions > 0
        ? submittedSubmissions.reduce((sum, s) => sum + (s.total_score || 0), 0) / totalSubmissions
        : 0,
      averagePercentage: totalSubmissions > 0
        ? submittedSubmissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / totalSubmissions
        : 0,
      passedCount: submittedSubmissions.filter(s => s.is_passed).length,
      failedCount: submittedSubmissions.filter(s => !s.is_passed && s.is_submitted).length,
      autoSubmittedCount: submittedSubmissions.filter(s => s.auto_submitted).length
    }

    // Calculate question-level statistics
    const questionStats: Record<string, any> = {}
    
    submittedSubmissions.forEach(submission => {
      if (submission.answers && typeof submission.answers === 'object') {
        Object.entries(submission.answers).forEach(([questionId, answer]: [string, any]) => {
          if (!questionStats[questionId]) {
            questionStats[questionId] = {
              totalAttempts: 0,
              correctAttempts: 0,
              averageScore: 0,
              totalScore: 0
            }
          }
          
          questionStats[questionId].totalAttempts++
          if (answer.is_correct) {
            questionStats[questionId].correctAttempts++
          }
          questionStats[questionId].totalScore += (answer.points_earned || 0)
        })
      }
    })

    // Calculate averages
    Object.keys(questionStats).forEach(questionId => {
      const stat = questionStats[questionId]
      stat.averageScore = stat.totalAttempts > 0 
        ? stat.totalScore / stat.totalAttempts 
        : 0
      stat.successRate = stat.totalAttempts > 0
        ? (stat.correctAttempts / stat.totalAttempts) * 100
        : 0
    })

    return NextResponse.json({
      success: true,
      exam: {
        title: exam.title,
        totalMarks: exam.total_marks
      },
      submissions: submissions || [],
      stats,
      questionStats
    })

  } catch (error) {
    console.error('Error fetching exam results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
