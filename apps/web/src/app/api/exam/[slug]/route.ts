import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/exam/:slug?json=1
 * 
 * This endpoint serves dual purpose:
 * 1. With ?json=1 query param: Returns JSON for Electron app validation
 * 2. Without it: Could redirect to exam page (or return full HTML)
 * 
 * Required by Electron app for test validation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const jsonMode = searchParams.get('json') === '1'

    const supabase = createSupabaseServerClient()

    // Fetch exam by slug
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select(`
        id,
        title,
        slug,
        description,
        duration_minutes,
        start_time,
        end_time,
        total_marks,
        is_published,
        strict_level,
        require_invite_token,
        exam_sections(
          id,
          exam_questions(id)
        )
      `)
      .eq('slug', params.slug)
      .single()

    if (examError || !exam) {
      logger.error('Exam not found:', examError)
      
      if (jsonMode) {
        return NextResponse.json(
          { error: 'Test not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    // Check if exam is published
    if (!exam.is_published) {
      if (jsonMode) {
        return NextResponse.json(
          { error: 'Test not available' },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: 'Exam not published' },
        { status: 403 }
      )
    }

    // Count total questions
    const questionCount = exam.exam_sections.reduce(
      (total: number, section: any) => total + (section.exam_questions?.length || 0),
      0
    )

    if (jsonMode) {
      // Return JSON format for Electron app validation
      return NextResponse.json({
        quiz: {
          id: exam.id,
          title: exam.title,
          slug: exam.slug,
          duration: exam.duration_minutes * 60, // Convert to seconds
          questions: questionCount,
          totalMarks: exam.total_marks,
          startTime: exam.start_time,
          endTime: exam.end_time,
          requiresInvite: exam.require_invite_token,
          strictLevel: exam.strict_level || 1
        }
      })
    }

    // Regular mode - return full exam data or redirect
    return NextResponse.json({
      success: true,
      exam: {
        id: exam.id,
        title: exam.title,
        slug: exam.slug,
        description: exam.description,
        duration_minutes: exam.duration_minutes,
        total_marks: exam.total_marks,
        question_count: questionCount
      }
    })

  } catch (error) {
    logger.error('Error in exam validation endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
