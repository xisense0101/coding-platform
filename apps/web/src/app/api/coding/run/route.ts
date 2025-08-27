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
    const { questionId, code, language, courseId, testCases, customInput } = body

    if (!questionId || !code) {
      return NextResponse.json({ error: 'questionId and code are required' }, { status: 400 })
    }

    const answerPayload = {
      code,
      language,
      customInput: customInput ?? null,
      testCases: testCases ?? null,
      run: true
    }

    const { data, error } = await supabase
      .from('attempts')
      .insert({
        user_id: user.id,
        question_id: questionId,
        attempt_type: 'coding',
        answer: answerPayload,
        language: language || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting run attempt:', error)
      return NextResponse.json({ error: 'Failed to create run attempt' }, { status: 500 })
    }

    return NextResponse.json({ attempt: data })
  } catch (err) {
    console.error('Unexpected error in coding run API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
