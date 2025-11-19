import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/database/supabase-server'
import { createRequestLogger, getRequestId } from '@/server/utils/logger'
import { validateBody } from '@/server/utils/validation'
import { submitCodeSchema } from '@/server/schemas/coding'
import { UnauthorizedError, InternalServerError } from '@/server/utils/errors'
import { withRateLimit, RateLimitPresets } from '@/server/middleware/rateLimit'
import { NextRequest } from 'next/server'

async function handler(request: NextRequest) {
  const requestId = getRequestId(request.headers)
  const log = createRequestLogger(requestId, { endpoint: '/api/coding/submit' })
  
  try {
    const supabase = createSupabaseServerClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      log.warn('Unauthorized submission attempt')
      throw new UnauthorizedError()
    }

    log.info({ userId: user.id }, 'Submission request received')

    // Validate input
    const validated = await validateBody(request, submitCodeSchema)
    const { 
      questionId, 
      code, 
      language, 
      courseId,
      testCasesPassed = 0,
      totalTestCases = 0,
      isCorrect = false
    } = validated

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

    log.info({ questionId, attemptNumber }, 'Creating submission')

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
      log.error({ error: error.message }, 'Failed to create submission')
      throw new InternalServerError('Failed to create submission')
    }

    log.info({ 
      submissionId: data.id,
      testCasesPassed,
      totalTestCases 
    }, 'Submission created successfully')

    // Return legacy format for backward compatibility
    return NextResponse.json({ 
      success: true,
      submission: data,
      message: totalTestCases > 0 
        ? `Code submitted! ${testCasesPassed}/${totalTestCases} test cases passed.`
        : 'Code submitted successfully!'
    }, {
      headers: { 'X-Request-ID': requestId }
    })
  } catch (err: any) {
    log.error({ error: err.message }, 'Submission failed')
    
    // Return legacy error format
    const statusCode = err instanceof UnauthorizedError ? 401 : 500
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { 
        status: statusCode,
        headers: { 'X-Request-ID': requestId }
      }
    )
  }
}

// Apply rate limiting - standard preset for submissions
export const POST = withRateLimit(handler, RateLimitPresets.standard)
