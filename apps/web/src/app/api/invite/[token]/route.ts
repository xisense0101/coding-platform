import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createSupabaseServerClient()

    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, title, slug, start_time, end_time, is_published')
      .eq('invite_token', params.token)
      .single()

    if (examError || !exam) {
      return NextResponse.json(
        { error: 'Invalid invite token' },
        { status: 404 }
      )
    }

    if (!exam.is_published) {
      return NextResponse.json(
        { error: 'Exam is not published' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      title: exam.title,
      start_time: exam.start_time,
      end_time: exam.end_time,
      slug: exam.slug,
      server_time: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Error in invite token check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
