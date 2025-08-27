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
    const { questionId, code, language, courseId } = body

    if (!questionId || !code) {
      return NextResponse.json({ error: 'questionId and code are required' }, { status: 400 })
    }

    const answerPayload = {
      code,
      language,
      submitted: true
    }

    const { data, error } = await supabase
      .from('attempts')
      .insert({
        user_id: user.id,
        question_id: questionId,
        attempt_type: 'coding',
        answer: answerPayload,
        language: language || null,
        created_at: new Date().toISOString(),
        is_correct: null
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting submit attempt:', error)
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
    }

    return NextResponse.json({ submission: data })
  } catch (err) {
    console.error('Unexpected error in coding submit API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
