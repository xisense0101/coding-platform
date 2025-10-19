import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/exam/getCurrentTypeOfExecution?quizId=:examId
 * 
 * Returns the strictness level of exam monitoring
 * Required by Electron app to determine monitoring behavior
 * 
 * Types:
 * - 1 = Relaxed mode (no restrictions)
 * - 2 = Medium mode (some restrictions)
 * - 3 = Strict mode (full lockdown)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId') || searchParams.get('examId')

    if (!quizId) {
      return NextResponse.json(
        { error: 'Missing quizId parameter' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()

    // Fetch exam strict level
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, strict_level, proctoring_enabled, lock_screen, prevent_tab_switching')
      .eq('id', quizId)
      .single()

    if (examError || !exam) {
      logger.error('Exam not found for execution type:', examError)
      // Default to relaxed mode if exam not found
      return NextResponse.json({ type: 1 })
    }

    // Return the strict level (default to 1 if not set)
    const strictLevel = exam.strict_level || 1

    return NextResponse.json({
      type: strictLevel,
      proctoring: exam.proctoring_enabled || false,
      lockScreen: exam.lock_screen || false,
      preventTabSwitching: exam.prevent_tab_switching || false
    })

  } catch (error) {
    logger.error('Error getting execution type:', error)
    // Default to relaxed mode on error
    return NextResponse.json({ type: 1 })
  }
}
