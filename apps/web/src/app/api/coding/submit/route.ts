import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

import { logger } from '@/lib/utils/logger'

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      questionId, 
      code, 
      language, 
      courseId,
      testCasesPassed = 0,
      totalTestCases = 0,
      isCorrect = false
    } = body

    if (!questionId || code === undefined) {
      return NextResponse.json({ error: 'questionId and code are required' }, { status: 400 })
    }

    // Get the current attempt number for this user and question (only count submitted attempts)
    const { data: existingAttempts, error: countError } = await supabase
      .from('attempts')
      .select('attempt_number')
      .eq('user_id', user.id)
      .eq('question_id', questionId)
      .not('submitted_at', 'is', null) // Only count submissions, not runs
      .order('attempt_number', { ascending: false })
      .limit(1)

    const attemptNumber = existingAttempts && existingAttempts.length > 0 
      ? existingAttempts[0].attempt_number + 1 
      : 1

    const answerPayload = {
      code, // Store only the body (user's editable code)
      language,
      submitted: true
    }

    const { data, error } = await supabase
      .from('attempts')
      .insert({
        user_id: user.id,
        question_id: questionId,
        attempt_number: attemptNumber,
        attempt_type: 'coding',
        answer: answerPayload,
        language: language || null,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_correct: isCorrect,
        points_earned: 0,
        max_points: 0,
        auto_graded: false,
        test_cases_passed: testCasesPassed,
        total_test_cases: totalTestCases
      })
      .select()
      .single()

    if (error) {
      logger.error('Error inserting submit attempt:', error)
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      submission: data,
      message: totalTestCases > 0 
        ? `Code submitted! ${testCasesPassed}/${totalTestCases} test cases passed.`
        : 'Code submitted successfully!'
    })
  } catch (err) {
    logger.error('Unexpected error in coding submit API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
