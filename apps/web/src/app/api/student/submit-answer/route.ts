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
      answer, 
      attemptType 
    } = body

    if (!questionId || !answer) {
      return NextResponse.json({ error: 'questionId and answer are required' }, { status: 400 })
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

    // For essay/reading, we consider it "correct" if they submit it (mark as complete)
    // You might want to add more logic here if needed
    const isCorrect = true 

    const { data, error } = await supabase
      .from('attempts')
      .insert({
        user_id: user.id,
        question_id: questionId,
        attempt_number: attemptNumber,
        attempt_type: attemptType || 'essay',
        answer: answer,
        is_correct: isCorrect,
        points_earned: isCorrect ? 100 : 0, // Assuming 100 for completion
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      logger.error('Error saving attempt:', error)
      return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 })
    }

    return NextResponse.json({ success: true, attempt: data })
  } catch (error) {
    logger.error('Error in submit-answer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
