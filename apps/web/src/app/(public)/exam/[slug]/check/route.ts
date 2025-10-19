import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Check if json parameter is present
    const searchParams = request.nextUrl.searchParams
    const isJsonRequest = searchParams.get('json') === '1'

    if (!isJsonRequest) {
      return NextResponse.json(
        { error: 'Missing json=1 parameter' },
        { status: 400 }
      )
    }

    // Fetch exam data from database
    const supabase = createSupabaseServerClient()

    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, title, slug')
      .eq('slug', params.slug)
      .eq('is_published', true)
      .single()

    if (examError || !exam) {
      logger.error('Error fetching exam for JSON check:', examError)
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    // Return JSON response in the format requested
    const quizData = {
      quiz: {
        id: exam.slug,
        title: exam.title
      }
    }

    return NextResponse.json(quizData)
  } catch (error) {
    logger.error('Error in exam JSON check endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
