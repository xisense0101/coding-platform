import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

export async function GET(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    const supabase = createSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { questionId } = params

    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
    }

    // Fetch only submitted attempts for this user and question, ordered by most recent first
    const { data: attempts, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('question_id', questionId)
      .not('submitted_at', 'is', null) // Only show submissions, not run attempts
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching attempts:', error)
      return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 })
    }

    return NextResponse.json({ attempts: attempts || [] })
  } catch (err) {
    console.error('Unexpected error in attempts API:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
