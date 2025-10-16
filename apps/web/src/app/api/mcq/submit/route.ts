import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { questionId, selectedOption, correctAnswers } = body

    if (!questionId || selectedOption === undefined) {
      return NextResponse.json({ error: 'questionId and selectedOption are required' }, { status: 400 })
    }

    // Get the current attempt number for this user and question
    const { data: existingAttempts } = await supabase
      .from('attempts')
      .select('attempt_number')
      .eq('user_id', user.id)
      .eq('question_id', questionId)
      .order('attempt_number', { ascending: false })
      .limit(1)

    const attemptNumber = existingAttempts && existingAttempts.length > 0 
      ? existingAttempts[0].attempt_number + 1 
      : 1

    // Check if answer is correct
    const isCorrect = correctAnswers && correctAnswers.includes(selectedOption)

    const answerPayload = {
      selectedOption,
      submitted: true
    }

    const { data, error } = await supabase
      .from('attempts')
      .insert({
        user_id: user.id,
        question_id: questionId,
        attempt_number: attemptNumber,
        attempt_type: 'mcq',
        answer: answerPayload,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_correct: isCorrect,
        points_earned: isCorrect ? 1 : 0,
        max_points: 1,
        auto_graded: true,
        test_cases_passed: 0,
        total_test_cases: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting MCQ attempt:', error)
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      submission: data,
      isCorrect,
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer. Try again!'
    })
  } catch (err) {
    console.error('Unexpected error in MCQ submit API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
